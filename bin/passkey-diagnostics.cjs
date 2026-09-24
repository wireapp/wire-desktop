// Only log selected build metadata; never dump provisioning profiles or credentials.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const log = message => console.log(`[Passkeys] ${message}`);
const check = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
  log(`PASS: ${message}`);
};

function runtime() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  log(`Node ${process.versions.node}; platform ${process.platform}; architecture ${process.arch}`);
  log(`Requested Electron ${require('../package.json').devDependencies.electron}`);
  check(major > 22 || (major === 22 && minor >= 12), 'Node must be >=22.12.0 for Electron 43.');
  log('Build checks do not perform a passkey login. A signed app must still be tested on a user device.');
}

function command(executable, args, input) {
  try {
    return execFileSync(executable, args, {input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']});
  } catch {
    // Command output may contain the provisioning profile. Do not include it in errors.
    throw new Error(`${path.basename(executable)} ${args[0]} failed. Check the app signature or provisioning profile.`);
  }
}

function plist(data) {
  // Profiles contain dates and certificate data, which plutil cannot convert to JSON.
  return require('plist').parse(command('/usr/bin/plutil', ['-convert', 'xml1', '-o', '-', '-'], data));
}

function matches(pattern, value) {
  return (
    typeof pattern === 'string' &&
    (pattern === value || (pattern.endsWith('*') && value.startsWith(pattern.slice(0, -1))))
  );
}

function validate({bundleId, group, entitlements, profile}, now = new Date()) {
  check(typeof group === 'string' && group.length > 0, 'Runtime keychain access group is configured.');
  check(
    entitlements['keychain-access-groups']?.includes(group),
    'Signed app entitlement must include the runtime keychain access group.',
  );
  const teams = profile.TeamIdentifier || [];
  check(
    teams.some(team => group.startsWith(`${team}.`)),
    'Profile team must match the keychain access group.',
  );
  const allowed = profile.Entitlements || {};
  check(
    (allowed['keychain-access-groups'] || []).some(pattern => matches(pattern, group)),
    'Provisioning profile must authorize the keychain access group.',
  );
  const appId = allowed['com.apple.application-identifier'] || allowed['application-identifier'];
  check(
    (profile.ApplicationIdentifierPrefix || teams).some(prefix => matches(appId, `${prefix}.${bundleId}`)),
    'Provisioning profile must authorize the built app bundle identifier.',
  );
  check(new Date(profile.ExpirationDate) > now, 'Provisioning profile must not be expired.');
  log(`Profile expires: ${profile.ExpirationDate}`);
}

function macos() {
  const buildDir = path.resolve('wrap/build');
  check(fs.existsSync(buildDir), 'Build output directory must exist.');
  const apps = fs
    .readdirSync(buildDir, {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .flatMap(entry => {
      const dir = path.join(buildDir, entry.name);
      return fs
        .readdirSync(dir)
        .filter(name => name.endsWith('.app'))
        .map(name => path.join(dir, name));
    });
  check(
    apps.length === 1,
    `Expected exactly one built .app; found ${apps.length}. Clean wrap/build if there are stale builds.`,
  );
  const app = apps[0];
  log(`Inspecting built app: ${path.relative(process.cwd(), app)}`);
  const contents = path.join(app, 'Contents');
  const info = plist(fs.readFileSync(path.join(contents, 'Info.plist')));
  log(`Bundle identifier: ${info.CFBundleIdentifier}; version: ${info.CFBundleShortVersionString}`);
  const resources = path.join(contents, 'Resources');
  const asar = path.join(resources, 'app.asar');
  const wireJson = fs.existsSync(asar)
    ? require('@electron/asar').extractFile(asar, 'electron/wire.json').toString()
    : fs.readFileSync(path.join(resources, 'app', 'electron', 'wire.json'), 'utf8');
  const group = JSON.parse(wireJson).webAuthnKeychainAccessGroup;
  log(`Built runtime keychain group: ${group || '(missing)'}`);
  const embeddedProfile = path.join(contents, 'embedded.provisionprofile');
  check(fs.existsSync(embeddedProfile), 'App must contain Contents/embedded.provisionprofile.');
  const profile = plist(command('/usr/bin/security', ['cms', '-D', '-i', embeddedProfile]));
  log('PASS: Embedded provisioning profile decoded.');
  command('/usr/bin/codesign', ['--verify', '--deep', '--strict', app]);
  log('PASS: App signature verified (--deep --strict).');
  const entitlements = plist(command('/usr/bin/codesign', ['--display', '--entitlements', ':-', app]));
  validate({bundleId: info.CFBundleIdentifier, group, entitlements, profile});
  log('BUILD CHECKS PASSED: Passkey signing prerequisites are present.');
  log('MANUAL TEST REQUIRED: Launch this signed app with --enable-logging and complete passkey login.');
  log('Touch ID credentials are device-bound; these checks do not verify iCloud/Safari passkeys or IdP acceptance.');
}

if (require.main === module) {
  try {
    if (process.argv[2] === 'macos') {
      macos();
    } else {
      runtime();
    }
  } catch (error) {
    console.error(`[Passkeys] FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {validate, plist};

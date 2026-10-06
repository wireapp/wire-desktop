//@ts-check

/** @typedef {import('@wireapp/copy-config').CopyConfigOptions} CopyConfigOptions */

const path = require('path');

const appConfigPkg = require('./app-config/package.json');

const contentSource = 'wire-desktop/content';
const imageSource = `${contentSource}/image`;
const macOsSource = `${contentSource}/macos`;

const getConfigurationEntry = () => {
  if (process.env.APP_ENV === 'wire-gov') return 'wire-web-config-wire-gov';
  if (process.env.APP_ENV === 'internal') return 'wire-web-config-internal';
  return 'wire-web-config-production';
};
const configurationEntry = getConfigurationEntry();
let repositoryUrl = appConfigPkg.dependencies[configurationEntry];

// Jenkins supplies the deploy key; copy-config handles the SSH clone and file copies.
// Without a deploy key, retain the existing HTTPS configuration for other callers.
if (process.env.APP_ENV === 'wire-gov' && process.env.WIREGOV_DEPLOY_KEY) {
  repositoryUrl = repositoryUrl.replace(/^https:\/\/github\.com\//, 'git@github.com:');
  process.env.WIREGOV_KNOWN_HOSTS = path.join(__dirname, 'app-config/github_known_hosts');
  // Allow only key passphrase prompts through Jenkins' temporary ASKPASS helper.
  const authenticationOptions = process.env.SSH_ASKPASS
    ? '-o BatchMode=no -o NumberOfPasswordPrompts=1 -o PreferredAuthentications=publickey '
    : '-o BatchMode=yes ';
  process.env.GIT_SSH_COMMAND =
    'ssh -F /dev/null -i "$WIREGOV_DEPLOY_KEY" -o IdentitiesOnly=yes ' +
    authenticationOptions +
    '-o StrictHostKeyChecking=yes -o HostKeyAlgorithms=ssh-ed25519 ' +
    '-o GlobalKnownHostsFile=/dev/null -o UserKnownHostsFile="$WIREGOV_KNOWN_HOSTS"';
}

/** @type {CopyConfigOptions} */
const options = {
  files: {
    [`${imageSource}/**`]: 'electron/img/',
    [`${macOsSource}/**`]: 'resources/macos/',
    [`${imageSource}/logo/256x256.png`]: ['resources/icons/256x256.png', 'electron/img/logo.256.png', 'electron/img/logo.png'],
    [`${imageSource}/logo/32x32.png`]: 'resources/icons/32x32.png',
    [`${imageSource}/logo/logo.ico`]: 'electron/img/logo.ico',
    ['wire-desktop/.env.defaults']: '.env.defaults',
  },
  repositoryUrl,
}

module.exports = options;

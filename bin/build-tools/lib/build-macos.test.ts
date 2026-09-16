/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import {ArchOption} from 'electron-packager';
import fs from 'fs-extra';
import {restore, stub} from 'sinon';

import * as assert from 'assert';
import {exec} from 'child_process';
import * as os from 'os';
import * as path from 'path';
import {promisify} from 'util';

import {buildMacOSConfig, buildMacOSWrapper} from './build-macos';

import {generateUUID} from '../../bin-utils';

const sourceWireJsonPath = path.join(__dirname, '../../../electron/wire.json');

describe('build-macos', () => {
  let directory: string;
  let wireJsonPath: string;
  let envFilePath: string;
  let plistPath: string;
  let originalEnvironment: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnvironment = {...process.env};
    for (const name of Object.keys(process.env)) {
      if (name.startsWith('MACOS_') || name === 'APPLE_EXPORT_COMPLIANCE_CODE') {
        delete process.env[name];
      }
    }
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-macos-test-'));
    wireJsonPath = path.join(directory, 'wire.json');
    envFilePath = path.join(directory, '.env.defaults');
    plistPath = path.join(directory, 'Info.plist.json');
    await fs.copy(sourceWireJsonPath, wireJsonPath);
    await fs.writeFile(envFilePath, '');
    await fs.writeJson(plistPath, {CFBundleIconFile: 'Legacy.icns', LSMinimumSystemVersion: '12.0'});
    // These fixtures exercise packaging configuration, not Apple's binary icon formats.
    await fs.writeFile(path.join(directory, 'logo.icns'), 'legacy icon fixture');
  });

  afterEach(async () => {
    restore();
    process.env = originalEnvironment;
    await fs.remove(directory);
  });

  describe('buildMacOSConfig', () => {
    it('preserves legacy-only branding, the deployment target, and universal packaging', async () => {
      const {packagerConfig} = await buildMacOSConfig(wireJsonPath, envFilePath, true, undefined, directory);

      assert.strictEqual(packagerConfig.icon, path.join(directory, 'logo.icns'));
      assert.deepStrictEqual(packagerConfig.extendInfo, {
        CFBundleIconFile: 'Legacy.icns',
        LSMinimumSystemVersion: '12.0',
      });
      assert.deepStrictEqual(packagerConfig.extraResource, []);
      assert.strictEqual(packagerConfig.arch, 'universal');
      assert.strictEqual(packagerConfig.platform, 'mas');
      assert.deepStrictEqual(packagerConfig.osxUniversal, {mergeASARs: true});
    });

    const architectures: ArchOption[] = ['x64', 'arm64', 'universal'];
    for (const architecture of architectures) {
      for (const manualSign of [true, false]) {
        it(`packages the same Tahoe catalog with the legacy icon for ${architecture}, manual sign ${manualSign}`, async () => {
          const plist = {
            CFBundleIconFile: 'Legacy.icns',
            CFBundleIconName: 'WireTahoe',
            LSMinimumSystemVersion: '12.0',
            NSCameraUsageDescription: 'Camera permission',
          };
          await fs.writeJson(plistPath, plist);
          const catalog = path.join(directory, 'Assets.car');
          await fs.writeFile(catalog, 'compiled catalog fixture');

          const {packagerConfig} = await buildMacOSConfig(
            wireJsonPath,
            envFilePath,
            manualSign,
            architecture,
            directory,
          );

          assert.strictEqual(packagerConfig.icon, path.join(directory, 'logo.icns'));
          assert.deepStrictEqual(packagerConfig.extraResource, [catalog]);
          assert.deepStrictEqual(packagerConfig.extendInfo, plist);
          assert.strictEqual(packagerConfig.arch, architecture);
          assert.deepStrictEqual(packagerConfig.osxUniversal, {mergeASARs: true});
        });
      }
    }

    it('rejects a missing legacy icon even when the Tahoe catalog is available', async () => {
      await fs.writeJson(plistPath, {CFBundleIconName: 'WireTahoe'});
      await fs.writeFile(path.join(directory, 'Assets.car'), 'compiled catalog fixture');
      await fs.remove(path.join(directory, 'logo.icns'));

      await assert.rejects(
        buildMacOSConfig(wireJsonPath, envFilePath, true, 'universal', directory),
        /Missing macOS icon resource: .*logo\.icns/,
      );
    });

    it('rejects a named Tahoe icon without its catalog', async () => {
      await fs.writeJson(plistPath, {CFBundleIconName: 'WireTahoe'});

      await assert.rejects(
        buildMacOSConfig(wireJsonPath, envFilePath, true, 'universal', directory),
        /Missing macOS icon resource: .*Assets\.car/,
      );
    });

    it('rejects an orphaned catalog instead of packaging stale branding', async () => {
      await fs.writeFile(path.join(directory, 'Assets.car'), 'stale catalog fixture');

      await assert.rejects(
        buildMacOSConfig(wireJsonPath, envFilePath, true, 'universal', directory),
        /Assets\.car requires CFBundleIconName/,
      );
    });

    for (const fileName of ['logo.icns', 'Assets.car']) {
      it(`rejects an empty ${fileName}`, async () => {
        await fs.writeJson(plistPath, {CFBundleIconName: 'WireTahoe'});
        await fs.writeFile(path.join(directory, 'Assets.car'), 'compiled catalog fixture');
        await fs.writeFile(path.join(directory, fileName), '');

        await assert.rejects(
          buildMacOSConfig(wireJsonPath, envFilePath, true, 'universal', directory),
          /macOS icon resource must be a non-empty file/,
        );
      });
    }

    it('rejects a directory supplied as a catalog', async () => {
      await fs.writeJson(plistPath, {CFBundleIconName: 'WireTahoe'});
      await fs.ensureDir(path.join(directory, 'Assets.car'));

      await assert.rejects(
        buildMacOSConfig(wireJsonPath, envFilePath, true, 'universal', directory),
        /macOS icon resource must be a non-empty file/,
      );
    });

    for (const iconName of ['', ' ', null, 26, '../Wire', 'Wire.icon', 'Wire.icns']) {
      it(`rejects an invalid catalog icon name ${JSON.stringify(iconName)}`, async () => {
        await fs.writeJson(plistPath, {CFBundleIconName: iconName});

        await assert.rejects(
          buildMacOSConfig(wireJsonPath, envFilePath, true, 'universal', directory),
          /CFBundleIconName must name the compiled macOS icon/,
        );
      });
    }

    it('honors environment variables', async () => {
      const bundleId = generateUUID();
      const certNameApplication = generateUUID();
      const certNameInstaller = generateUUID();
      const notarizeAppleId = generateUUID();
      const notarizeApplePassword = generateUUID();

      process.env.MACOS_BUNDLE_ID = bundleId;
      process.env.MACOS_CERTIFICATE_NAME_APPLICATION = certNameApplication;
      process.env.MACOS_CERTIFICATE_NAME_INSTALLER = certNameInstaller;
      process.env.MACOS_NOTARIZE_APPLE_ID = notarizeAppleId;
      process.env.MACOS_NOTARIZE_APPLE_PASSWORD = notarizeApplePassword;

      const {macOSConfig} = await buildMacOSConfig(wireJsonPath, envFilePath, true, 'universal', directory);

      assert.strictEqual(macOSConfig.bundleId, bundleId);
      assert.strictEqual(macOSConfig.certNameApplication, certNameApplication);
      assert.strictEqual(macOSConfig.certNameInstaller, certNameInstaller);
      assert.strictEqual(macOSConfig.notarizeAppleId, notarizeAppleId);
      assert.strictEqual(macOSConfig.notarizeApplePassword, notarizeApplePassword);

      delete process.env.MACOS_BUNDLE_ID;
      delete process.env.MACOS_CERTIFICATE_NAME_APPLICATION;
      delete process.env.MACOS_CERTIFICATE_NAME_INSTALLER;
      delete process.env.MACOS_NOTARIZE_APPLE_ID;
      delete process.env.MACOS_NOTARIZE_APPLE_PASSWORD;
    });
  });

  describe('buildMacOSWrapper', () => {
    it('propagates a preparation failure and restores files already modified', async () => {
      const packageJsonPath = path.join(directory, 'package.json');
      const originalPackage = '{"name":"test-package","version":"1.0.0"}\n';
      await fs.writeFile(packageJsonPath, originalPackage);
      const originalWire = await fs.readFile(wireJsonPath, 'utf8');
      const {macOSConfig, packagerConfig} = await buildMacOSConfig(
        wireJsonPath,
        envFilePath,
        true,
        'universal',
        directory,
      );
      const failure = new Error('Failed to prepare wire.json');
      stub(fs, 'writeJson').callThrough().withArgs(wireJsonPath).rejects(failure);

      await assert.rejects(
        buildMacOSWrapper(packagerConfig, macOSConfig, packageJsonPath, wireJsonPath, envFilePath, true),
        failure,
      );
      assert.strictEqual(await fs.readFile(packageJsonPath, 'utf8'), originalPackage);
      assert.strictEqual(await fs.readFile(wireJsonPath, 'utf8'), originalWire);
    });

    it('propagates a packaging failure and restores both source files', async () => {
      const packageJsonPath = path.join(directory, 'package.json');
      const originalPackage = '{"name":"test-package","version":"1.0.0"}\n';
      await fs.writeFile(packageJsonPath, originalPackage);
      const originalWire = await fs.readFile(wireJsonPath, 'utf8');
      const {macOSConfig, packagerConfig} = await buildMacOSConfig(
        wireJsonPath,
        envFilePath,
        true,
        'universal',
        directory,
      );
      packagerConfig.dir = path.join(directory, 'missing-app');

      await assert.rejects(
        buildMacOSWrapper(packagerConfig, macOSConfig, packageJsonPath, wireJsonPath, envFilePath, true),
        /Could not locate a package\.json file/,
      );
      assert.strictEqual(await fs.readFile(packageJsonPath, 'utf8'), originalPackage);
      assert.strictEqual(await fs.readFile(wireJsonPath, 'utf8'), originalWire);
    });
  });

  it('removes the previous catalog when configuring a legacy-only branding variant', async () => {
    const root = path.resolve(__dirname, '../../..');
    const workspace = path.join(directory, 'workspace');
    const configuration = path.join(directory, 'configuration');
    const macos = path.join(configuration, 'wire-desktop/content/macos');
    const images = path.join(configuration, 'wire-desktop/content/image/logo');
    await fs.copy(path.join(root, '.copyconfigrc.js'), path.join(workspace, '.copyconfigrc.js'));
    await fs.copy(path.join(root, 'app-config/package.json'), path.join(workspace, 'app-config/package.json'));
    await fs.ensureDir(macos);
    await fs.ensureDir(images);
    await fs.writeFile(path.join(configuration, 'wire-desktop/.env.defaults'), '');
    for (const file of ['256x256.png', '32x32.png', 'logo.ico']) {
      await fs.writeFile(path.join(images, file), 'image fixture');
    }
    await fs.writeFile(path.join(macos, 'logo.icns'), 'legacy icon fixture');
    await fs.writeJson(path.join(macos, 'Info.plist.json'), {CFBundleIconName: 'WireTahoe'});
    await fs.writeFile(path.join(macos, 'Assets.car'), 'production catalog fixture');
    const {scripts} = await fs.readJson(path.join(root, 'package.json'));
    const environment = {
      ...process.env,
      PATH: `${path.join(root, 'node_modules/.bin')}${path.delimiter}${process.env.PATH}`,
      WIRE_CONFIGURATION_EXTERNAL_DIR: configuration,
    };
    await promisify(exec)(scripts.configure, {cwd: workspace, env: environment});
    const copiedCatalog = path.join(workspace, 'resources/macos/Assets.car');
    assert.strictEqual(await fs.readFile(copiedCatalog, 'utf8'), 'production catalog fixture');

    await fs.remove(path.join(macos, 'Assets.car'));
    await fs.writeJson(path.join(macos, 'Info.plist.json'), {});
    await promisify(exec)(scripts.configure, {cwd: workspace, env: {...environment, APP_ENV: 'internal'}});

    assert.strictEqual(await fs.pathExists(copiedCatalog), false);
    assert.deepStrictEqual(await fs.readJson(path.join(workspace, 'resources/macos/Info.plist.json')), {});
    assert.strictEqual(
      await fs.readFile(path.join(workspace, 'resources/macos/logo.icns'), 'utf8'),
      'legacy icon fixture',
    );
  }).timeout(15000);
});

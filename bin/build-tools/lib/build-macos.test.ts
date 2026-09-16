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

import fs from 'fs-extra';

import * as assert from 'assert';
import {exec} from 'child_process';
import {mock} from 'node:test';
import * as os from 'os';
import * as path from 'path';
import {promisify} from 'util';

import {buildMacOSConfig} from './build-macos';

import {generateUUID} from '../../bin-utils';

const wireJsonPath = path.join(__dirname, '../../../electron/wire.json');
const envFilePath = path.join(__dirname, '../../../.env.defaults');

describe('build-macos', () => {
  describe('buildMacOSConfig', () => {
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

      const {macOSConfig} = await buildMacOSConfig(wireJsonPath, envFilePath);

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

  describe('app icons', () => {
    let directory: string;
    let plistPath: string;
    const resourcesDirectory = path.resolve(__dirname, '../../../resources/macos');
    const legacyPlist = {CFBundleIconFile: 'Legacy.icns', LSMinimumSystemVersion: '12.0'};
    const configure = () => buildMacOSConfig(wireJsonPath, envFilePath, true);

    beforeEach(async () => {
      directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-macos-icon-'));
      plistPath = path.join(directory, 'Info.plist.json');
      await fs.writeJson(plistPath, legacyPlist);
      // Fixtures test packaging configuration; native rendering requires macOS.
      await fs.writeFile(path.join(directory, 'logo.icns'), 'legacy icon');
      const {readJson, stat, pathExists} = fs;
      const fixtures = new Map([
        [path.join(resourcesDirectory, 'Info.plist.json'), plistPath],
        [path.join(resourcesDirectory, 'logo.icns'), path.join(directory, 'logo.icns')],
        [path.join(resourcesDirectory, 'Assets.car'), path.join(directory, 'Assets.car')],
      ]);
      mock.method(fs, 'readJson', (file: string) => readJson(fixtures.get(file) ?? file));
      mock.method(fs, 'stat', (file: string) => stat(fixtures.get(file) ?? file));
      mock.method(fs, 'pathExists', (file: string) => pathExists(fixtures.get(file) ?? file));
    });

    afterEach(async () => {
      mock.restoreAll();
      await fs.remove(directory);
    });

    it('keeps legacy-only branding and its deployment target unchanged', async () => {
      const {packagerConfig} = await configure();
      assert.strictEqual(packagerConfig.icon, path.join(resourcesDirectory, 'logo.icns'));
      assert.deepStrictEqual(packagerConfig.extendInfo, legacyPlist);
      assert.deepStrictEqual(packagerConfig.extraResource, []);
    });

    it('adds one precompiled catalog to the universal build and preserves the legacy icon', async () => {
      const plist = {...legacyPlist, CFBundleIconName: 'WireTahoe'};
      await fs.writeJson(plistPath, plist);
      const catalog = path.join(directory, 'Assets.car');
      await fs.writeFile(catalog, 'compiled catalog');

      const {packagerConfig} = await configure();
      assert.strictEqual(packagerConfig.icon, path.join(resourcesDirectory, 'logo.icns'));
      assert.deepStrictEqual(packagerConfig.extraResource, [path.join(resourcesDirectory, 'Assets.car')]);
      assert.deepStrictEqual(packagerConfig.extendInfo, plist);
      assert.strictEqual(packagerConfig.arch, 'universal');
      assert.deepStrictEqual(packagerConfig.osxUniversal, {mergeASARs: true});
    });

    it('rejects a catalog without a name and a name without a catalog', async () => {
      const catalog = path.join(directory, 'Assets.car');
      await fs.writeFile(catalog, 'compiled catalog');
      await assert.rejects(configure(), /require both Assets.car and its CFBundleIconName/);
      await fs.remove(catalog);
      await fs.writeJson(plistPath, {...legacyPlist, CFBundleIconName: 'WireTahoe'});
      await assert.rejects(configure(), /require both Assets.car and its CFBundleIconName/);
    });

    it('rejects empty icon resources and a missing legacy fallback', async () => {
      await fs.writeJson(plistPath, {...legacyPlist, CFBundleIconName: 'WireTahoe'});
      const catalog = path.join(directory, 'Assets.car');
      const legacy = path.join(directory, 'logo.icns');
      await fs.writeFile(catalog, '');
      await assert.rejects(configure(), /require non-empty logo.icns and Assets.car/);
      await fs.writeFile(catalog, 'compiled catalog');
      await fs.writeFile(legacy, '');
      await assert.rejects(configure(), /require non-empty logo.icns and Assets.car/);
      await fs.remove(legacy);
      await assert.rejects(configure(), /ENOENT.*logo\.icns/);
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
    });
  });
});

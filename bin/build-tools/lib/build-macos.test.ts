/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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
 */

import fs from 'fs-extra';

import * as assert from 'assert';
import os from 'os';
import * as path from 'path';

import {buildMacOSConfig, embedProvisioningProfile} from './build-macos';
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
      const provisioningProfile = __filename;

      process.env.MACOS_BUNDLE_ID = bundleId;
      process.env.MACOS_CERTIFICATE_NAME_APPLICATION = certNameApplication;
      process.env.MACOS_CERTIFICATE_NAME_INSTALLER = certNameInstaller;
      process.env.MACOS_NOTARIZE_APPLE_ID = notarizeAppleId;
      process.env.MACOS_NOTARIZE_APPLE_PASSWORD = notarizeApplePassword;
      process.env.MACOS_PROVISIONING_PROFILE = provisioningProfile;

      const {macOSConfig} = await buildMacOSConfig(wireJsonPath, envFilePath);

      assert.strictEqual(macOSConfig.bundleId, bundleId);
      assert.strictEqual(macOSConfig.certNameApplication, certNameApplication);
      assert.strictEqual(macOSConfig.certNameInstaller, certNameInstaller);
      assert.strictEqual(macOSConfig.notarizeAppleId, notarizeAppleId);
      assert.strictEqual(macOSConfig.notarizeApplePassword, notarizeApplePassword);
      assert.strictEqual(macOSConfig.provisioningProfile, provisioningProfile);

      delete process.env.MACOS_BUNDLE_ID;
      delete process.env.MACOS_CERTIFICATE_NAME_APPLICATION;
      delete process.env.MACOS_CERTIFICATE_NAME_INSTALLER;
      delete process.env.MACOS_NOTARIZE_APPLE_ID;
      delete process.env.MACOS_NOTARIZE_APPLE_PASSWORD;
      delete process.env.MACOS_PROVISIONING_PROFILE;
    });
  });
});

describe('embedProvisioningProfile', () => {
  let directory: string;
  let buildDir: string;
  let appFile: string;
  let profile: string;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-profile-test-'));
    buildDir = path.join(directory, 'build');
    appFile = path.join(buildDir, 'Wire.app');
    profile = path.join(directory, 'source.provisionprofile');
    await fs.ensureDir(path.join(appFile, 'Contents'));
    await fs.writeFile(profile, 'profile fixture', {mode: 0o600});
  });

  afterEach(async () => {
    await fs.remove(directory);
  });

  it('embeds a readable profile and replaces an existing profile', async () => {
    const destination = await embedProvisioningProfile(appFile, profile, buildDir);
    assert.strictEqual(await fs.readFile(destination, 'utf8'), 'profile fixture');
    if (process.platform !== 'win32') {
      assert.strictEqual((await fs.stat(destination)).mode & 0o777, 0o644);
    }
    await fs.writeFile(profile, 'replacement');
    await embedProvisioningProfile(appFile, profile, buildDir);
    assert.strictEqual(await fs.readFile(destination, 'utf8'), 'replacement');
  });

  it('rejects traversal to a sibling whose name shares the build-directory prefix', async () => {
    const outside = path.join(directory, 'build-other', 'Wire.app');
    await fs.ensureDir(path.join(outside, 'Contents'));
    await assert.rejects(
      embedProvisioningProfile(path.join(buildDir, '..', 'build-other', 'Wire.app'), profile, buildDir),
      /inside the build directory/,
    );
    assert.strictEqual(await fs.pathExists(path.join(outside, 'Contents', 'embedded.provisionprofile')), false);
  });

  it('rejects a Contents symlink that escapes the build directory', async () => {
    const outside = path.join(directory, 'outside');
    await fs.ensureDir(outside);
    await fs.remove(path.join(appFile, 'Contents'));
    await fs.symlink(outside, path.join(appFile, 'Contents'), 'junction');
    await assert.rejects(embedProvisioningProfile(appFile, profile, buildDir), /inside the build directory/);
    assert.strictEqual((await fs.readdir(outside)).length, 0);
  });

  it('does not overwrite a file through a destination symlink', async () => {
    const outside = path.join(directory, 'outside');
    await fs.writeFile(outside, 'unchanged');
    await fs.symlink(outside, path.join(appFile, 'Contents', 'embedded.provisionprofile'));
    await assert.rejects(embedProvisioningProfile(appFile, profile, buildDir), /regular file/);
    assert.strictEqual(await fs.readFile(outside, 'utf8'), 'unchanged');
  });

  it('replaces a dangling link without writing to its target', async () => {
    const outside = path.join(directory, 'absent');
    const destination = path.join(appFile, 'Contents', 'embedded.provisionprofile');
    await fs.symlink(outside, destination);
    await embedProvisioningProfile(appFile, profile, buildDir);
    assert.strictEqual((await fs.lstat(destination)).isSymbolicLink(), false);
    assert.strictEqual(await fs.pathExists(outside), false);
  });
});

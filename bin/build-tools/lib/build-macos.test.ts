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

import * as assert from 'assert';
import * as path from 'path';

import {buildMacOSConfig} from './build-macos';

import {generateUUID} from '../../bin-utils';

const wireJsonPath = path.join(__dirname, '../../../electron/wire.json');
const envFilePath = path.join(__dirname, '../../../.env.defaults');

describe('build-macos', () => {
  describe('buildMacOSConfig', () => {
    it('packages the browser authentication bridge for every macOS variant', async () => {
      const original = {...process.env};
      try {
        process.env.MACOS_CERTIFICATE_NAME_APPLICATION = '';
        process.env.ENABLE_ASAR = 'true';
        for (const environment of ['internal', 'production', 'wire-gov']) {
          process.env.APP_ENV = environment;
          const {packagerConfig} = await buildMacOSConfig(wireJsonPath, envFilePath);
          assert.strictEqual((packagerConfig.asar as {unpack: string}).unpack, '**/*.node');
          assert.ok(packagerConfig.osxUniversal?.x64ArchFiles);
          assert.strictEqual(
            (packagerConfig.ignore as RegExp[]).some(pattern => pattern.test('/node_modules/objc-js/dist/index.js')),
            false,
          );
          for (const name of [
            'certificate.cer',
            'identity.p12',
            'identity.pfx',
            'private.key',
            'profile.provisionprofile',
          ]) {
            assert.ok((packagerConfig.ignore as RegExp[]).some(pattern => pattern.test(`/resources/macos/${name}`)));
          }
          assert.ok(
            !(packagerConfig.ignore as RegExp[]).some(pattern =>
              pattern.test('/resources/macos/entitlements/parent.plist'),
            ),
          );
          assert.strictEqual(packagerConfig.platform, 'mas');
        }
      } finally {
        for (const key of Object.keys(process.env)) {
          if (!(key in original)) {
            delete process.env[key];
          }
        }
        Object.assign(process.env, original);
      }
    });

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
});

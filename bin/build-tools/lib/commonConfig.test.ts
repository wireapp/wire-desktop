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

import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import uuid from 'uuid/v4';

import {getCommonConfig} from './commonConfig';

const wireJsonPath = path.join(__dirname, '../../../electron/wire.json');
const envFilePath = path.join(__dirname, '../../../.env.defaults');

describe('commonConfig', () => {
  describe('getCommonConfig', () => {
    it('honors environment variables', async () => {
      const adminUrl = uuid();
      const appBase = uuid();
      const buildNumber = uuid();
      const copyright = uuid();
      const customProtocolName = uuid();
      const description = uuid();
      const enableAsar = false;
      const legalUrl = uuid();
      const licensesUrl = uuid();
      const maximumAccounts = uuid();
      const name = uuid();
      const nameShort = uuid();
      const privacyUrl = uuid();
      const raygunApiKey = uuid();
      const supportUrl = uuid();
      const websiteUrl = uuid();

      process.env.URL_ADMIN = adminUrl;
      process.env.APP_BASE = appBase;
      process.env.BUILD_NUMBER = buildNumber;
      process.env.APP_COPYRIGHT = copyright;
      process.env.APP_CUSTOM_PROTOCOL_NAME = customProtocolName;
      process.env.APP_DESCRIPTION = description;
      process.env.ENABLE_ASAR = String(enableAsar);
      process.env.URL_LEGAL = legalUrl;
      process.env.URL_LICENSES = licensesUrl;
      process.env.APP_MAXIMUM_ACCOUNTS = maximumAccounts;
      process.env.APP_NAME = name;
      process.env.APP_NAME_SHORT = nameShort;
      process.env.URL_PRIVACY = privacyUrl;
      process.env.RAYGUN_API_KEY = raygunApiKey;
      process.env.URL_SUPPORT = supportUrl;
      process.env.URL_WEBSITE = websiteUrl;

      const {commonConfig} = await getCommonConfig(envFilePath, wireJsonPath);

      assert.strictEqual(commonConfig.adminUrl, adminUrl);
      assert.strictEqual(commonConfig.appBase, appBase);
      assert.strictEqual(commonConfig.buildNumber, buildNumber);
      assert.strictEqual(commonConfig.copyright, copyright);
      assert.strictEqual(commonConfig.customProtocolName, customProtocolName);
      assert.strictEqual(commonConfig.description, description);
      assert.strictEqual(commonConfig.enableAsar, enableAsar);
      assert.strictEqual(commonConfig.legalUrl, legalUrl);
      assert.strictEqual(commonConfig.licensesUrl, licensesUrl);
      assert.strictEqual(commonConfig.maximumAccounts, maximumAccounts);
      assert.strictEqual(commonConfig.name, name);
      assert.strictEqual(commonConfig.nameShort, nameShort);
      assert.strictEqual(commonConfig.privacyUrl, privacyUrl);
      assert.strictEqual(commonConfig.raygunApiKey, raygunApiKey);
      assert.strictEqual(commonConfig.supportUrl, supportUrl);
      assert.strictEqual(commonConfig.websiteUrl, websiteUrl);

      delete process.env.URL_ADMIN;
      delete process.env.APP_BASE;
      delete process.env.BUILD_NUMBER;
      delete process.env.APP_COPYRIGHT;
      delete process.env.APP_CUSTOM_PROTOCOL_NAME;
      delete process.env.APP_DESCRIPTION;
      delete process.env.ENABLE_ASAR;
      delete process.env.URL_LEGAL;
      delete process.env.URL_LICENSES;
      delete process.env.APP_MAXIMUM_ACCOUNTS;
      delete process.env.APP_NAME;
      delete process.env.APP_NAME_SHORT;
      delete process.env.URL_PRIVACY;
      delete process.env.RAYGUN_API_KEY;
      delete process.env.URL_SUPPORT;
      delete process.env.URL_WEBSITE;
    });

    it('loads the config from wire.json', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'build-tools-'));
      const tempWireJsonPath = path.join(tempDir, 'wire.json');
      const tempEnvFilePath = path.join(tempDir, '.env.defaults');

      const wireJson = {
        adminUrl: uuid(),
        appBase: uuid(),
        buildDir: uuid(),
        buildNumber: uuid(),
        copyright: uuid(),
        customProtocolName: uuid(),
        description: uuid(),
        distDir: uuid(),
        electronDirectory: uuid(),
        enableAsar: false,
        legalUrl: uuid(),
        licensesUrl: uuid(),
        maximumAccounts: uuid(),
        name: uuid(),
        nameShort: uuid(),
        privacyUrl: uuid(),
        raygunApiKey: uuid(),
        supportUrl: uuid(),
        updateUrl: uuid(),
        websiteUrl: uuid(),
      };

      await fs.writeJson(tempWireJsonPath, wireJson);
      await fs.writeFile(tempEnvFilePath, '', 'utf-8');

      const {commonConfig} = await getCommonConfig(tempEnvFilePath, tempWireJsonPath);

      assert.strictEqual(commonConfig.appBase, wireJson.appBase);
      assert.strictEqual(commonConfig.buildDir, wireJson.buildDir);
      assert.strictEqual(commonConfig.buildNumber, wireJson.buildNumber);
      assert.strictEqual(commonConfig.copyright, wireJson.copyright);
      assert.strictEqual(commonConfig.customProtocolName, wireJson.customProtocolName);
      assert.strictEqual(commonConfig.description, wireJson.description);
      assert.strictEqual(commonConfig.distDir, wireJson.distDir);
      assert.strictEqual(commonConfig.electronDirectory, wireJson.electronDirectory);
      assert.strictEqual(commonConfig.enableAsar, wireJson.enableAsar);
      assert.strictEqual(commonConfig.legalUrl, wireJson.legalUrl);
      assert.strictEqual(commonConfig.licensesUrl, wireJson.licensesUrl);
      assert.strictEqual(commonConfig.maximumAccounts, wireJson.maximumAccounts);
      assert.strictEqual(commonConfig.name, wireJson.name);
      assert.strictEqual(commonConfig.nameShort, wireJson.nameShort);
      assert.strictEqual(commonConfig.privacyUrl, wireJson.privacyUrl);
      assert.strictEqual(commonConfig.raygunApiKey, wireJson.raygunApiKey);
      assert.strictEqual(commonConfig.supportUrl, wireJson.supportUrl);
      assert.strictEqual(commonConfig.updateUrl, wireJson.updateUrl);
      assert.strictEqual(commonConfig.websiteUrl, wireJson.websiteUrl);

      await fs.remove(tempDir);
    });

    it('respects the hierarchy of config files', async () => {
      /*
       * The hierarchy (1 is most important):
       * 1: environment variables (e.g. process.env.APP_NAME)
       * 2: Values in the .env file (e.g. `.env.defaults`)
       * 3: Values in the `wire.json` file
       */

      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'build-tools-'));
      const tempWireJsonPath = path.join(tempDir, 'wire.json');
      const tempEnvFilePath = path.join(tempDir, '.env.defaults');

      const wireJson = {
        adminUrl: uuid(),
      };

      const envFile = {
        adminUrl: uuid(),
      };

      await fs.writeFile(tempEnvFilePath, '', 'utf-8');

      // Test 1: only wire.json is available
      await fs.writeJSON(tempWireJsonPath, wireJson);
      let config = await getCommonConfig(tempEnvFilePath, tempWireJsonPath);

      assert.strictEqual(config.commonConfig.adminUrl, wireJson.adminUrl);

      // Test 2: .env file is available, too
      await fs.writeFile(tempEnvFilePath, `URL_ADMIN = ${envFile.adminUrl}`, 'utf-8');
      config = await getCommonConfig(tempEnvFilePath, tempWireJsonPath);

      assert.strictEqual(config.commonConfig.adminUrl, envFile.adminUrl);
      assert.notStrictEqual(config.commonConfig.adminUrl, wireJson.adminUrl);

      // Test 3: environment variable is available, too
      process.env.URL_ADMIN = uuid();
      config = await getCommonConfig(tempEnvFilePath, tempWireJsonPath);

      assert.strictEqual(config.commonConfig.adminUrl, process.env.URL_ADMIN);
      assert.notStrictEqual(config.commonConfig.adminUrl, envFile.adminUrl);
      assert.notStrictEqual(config.commonConfig.adminUrl, wireJson.adminUrl);

      await fs.remove(tempDir);
      delete process.env.URL_ADMIN;
    });
  });
});

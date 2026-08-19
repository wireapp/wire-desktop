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

import assert from 'node:assert';
import path from 'node:path';

import {buildWindowsMsiConfig, customizeMsiProject} from './build-windows-msi';

const wireJsonPath = path.join(__dirname, '../../../electron/wire.json');
const envFilePath = path.join(__dirname, '../../../.env.defaults');
const originalEnvironment = {
  appEnvironment: process.env.APP_ENV,
  appName: process.env.APP_NAME,
  manufacturer: process.env.WIN_MSI_MANUFACTURER,
  upgradeCode: process.env.WIN_MSI_UPGRADE_CODE,
};

function restoreEnvironmentVariable(name: string, value?: string): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe('build-windows-msi', () => {
  afterEach(() => {
    restoreEnvironmentVariable('APP_ENV', originalEnvironment.appEnvironment);
    restoreEnvironmentVariable('APP_NAME', originalEnvironment.appName);
    restoreEnvironmentVariable('WIN_MSI_MANUFACTURER', originalEnvironment.manufacturer);
    restoreEnvironmentVariable('WIN_MSI_UPGRADE_CODE', originalEnvironment.upgradeCode);
  });

  describe('buildWindowsMsiConfig', () => {
    it('builds a per-machine MSI with a stable production upgrade identity', async () => {
      const {builderConfig, windowsMsiConfig} = await buildWindowsMsiConfig(wireJsonPath, envFilePath, true);

      assert.strictEqual(windowsMsiConfig.appId, 'com.squirrel.wire.wire');
      assert.strictEqual(windowsMsiConfig.manufacturer, 'Wire Swiss GmbH');
      assert.strictEqual(windowsMsiConfig.upgradeCode, '620FCDDD-30CB-4241-A347-D34CF682A358');
      assert.deepStrictEqual(builderConfig.extraMetadata?.author, {name: windowsMsiConfig.manufacturer});
      assert.strictEqual(builderConfig.msi?.oneClick, false);
      assert.strictEqual(builderConfig.msi?.perMachine, true);
      assert.strictEqual(builderConfig.msi?.runAfterFinish, false);
      assert.strictEqual(builderConfig.msi?.upgradeCode, windowsMsiConfig.upgradeCode);
      assert.strictEqual(typeof builderConfig.win?.signtoolOptions?.sign, 'function');
    });

    it('keeps the standard product upgrade identities distinct', async () => {
      process.env.APP_ENV = 'internal';
      process.env.APP_NAME = 'WireInternal';
      const internal = await buildWindowsMsiConfig(wireJsonPath, envFilePath);

      process.env.APP_ENV = 'wire-gov';
      process.env.APP_NAME = 'WireGov';
      const wireGov = await buildWindowsMsiConfig(wireJsonPath, envFilePath);

      assert.strictEqual(internal.windowsMsiConfig.upgradeCode, '673C5C7F-2923-483B-8EDB-34EDBDFCFF8A');
      assert.strictEqual(wireGov.windowsMsiConfig.upgradeCode, '0FC26EF0-E415-4263-9C73-89D05BCD4E1A');
      assert.notStrictEqual(internal.windowsMsiConfig.upgradeCode, wireGov.windowsMsiConfig.upgradeCode);
    });

    it('honors and normalizes a configured upgrade code', async () => {
      process.env.WIN_MSI_UPGRADE_CODE = '{C88AA646-1E4B-FC0A-005A-8BB72BBADBBB}';

      const {windowsMsiConfig} = await buildWindowsMsiConfig(wireJsonPath, envFilePath);

      assert.strictEqual(windowsMsiConfig.upgradeCode, 'C88AA646-1E4B-FC0A-005A-8BB72BBADBBB');
    });

    it('honors a configured manufacturer', async () => {
      process.env.WIN_MSI_MANUFACTURER = 'Customer Corporation';

      const {builderConfig, windowsMsiConfig} = await buildWindowsMsiConfig(wireJsonPath, envFilePath);

      assert.strictEqual(windowsMsiConfig.manufacturer, 'Customer Corporation');
      assert.strictEqual(builderConfig.extraMetadata?.author?.name, windowsMsiConfig.manufacturer);
    });

    it('rejects an invalid configured upgrade code', async () => {
      process.env.WIN_MSI_UPGRADE_CODE = 'not-a-guid';

      await assert.rejects(buildWindowsMsiConfig(wireJsonPath, envFilePath), /Invalid Windows MSI upgrade code/);
    });

    it('requires a dedicated upgrade code for a custom-branded product', async () => {
      process.env.APP_NAME = 'CustomerWire';

      await assert.rejects(buildWindowsMsiConfig(wireJsonPath, envFilePath), /must define a permanent/);
    });
  });

  describe('customizeMsiProject', () => {
    it('brands the assisted UI and makes the URL protocol and desktop shortcut identity MSI-owned', () => {
      const project = `
        <Product Name="Wire">
          <Condition Message="Windows 7 and above is required"><![CDATA[Installed OR VersionNT >= 601]]></Condition>
          <Component>
            <File Name="Wire.exe" Id="mainExecutable">
              <Shortcut Id="desktopShortcut" Directory="DesktopFolder" Name="Wire"/>
            </File>
          </Component>
        </Product>`;

      const result = customizeMsiProject(project, 'wire', 'com.squirrel.wire.wire', 'Wire', 'msi-banner.bmp');

      assert.match(result, /WixVariable Id="WixUIBannerBmp" Value="msi-banner\.bmp"/);
      assert.match(result, /Windows 10 or above is required/);
      assert.match(result, /VersionNT >= 603 AND WindowsBuild >= 10240/);
      assert.doesNotMatch(result, /VersionNT >= 1000/);
      assert.match(result, /ShortcutProperty Key="System\.AppUserModel\.ID" Value="com\.squirrel\.wire\.wire"/);
      assert.match(result, /RegistryKey Root="HKLM" Key="Software\\Classes\\wire"/);
      assert.match(result, /Value="&quot;\[#mainExecutable\]&quot; &quot;%1&quot;"/);
    });

    it('fails if electron-builder no longer generates the expected main executable component', () => {
      assert.throws(
        () => customizeMsiProject('<Product/>', 'wire', 'com.squirrel.wire.wire', 'Wire', 'msi-banner.bmp'),
        /Could not find the main executable/,
      );
    });

    it('fails if electron-builder no longer generates the expected desktop shortcut', () => {
      const project = `<Product>
        <Condition Message="Windows 7 and above is required"><![CDATA[Installed OR VersionNT >= 601]]></Condition>
        <Component><File Name="Wire.exe" Id="mainExecutable"/></Component>
      </Product>`;

      assert.throws(
        () => customizeMsiProject(project, 'wire', 'com.squirrel.wire.wire', 'Wire', 'msi-banner.bmp'),
        /Could not find the desktop shortcut/,
      );
    });
  });
});

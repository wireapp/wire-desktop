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
import fs from 'fs-extra';
import os from 'os';
import * as path from 'path';
import type {Options as ElectronWinstallerOptions} from 'electron-winstaller';

import {buildWindowsInstaller, buildWindowsInstallerConfig} from './build-windows-installer';
import {generateUUID} from '../../bin-utils';

const wireJsonPath = path.join(__dirname, '../../../electron/wire.json');
const envFilePath = path.join(__dirname, '../../../.env.defaults');

describe('build-windows-installer', () => {
  describe('buildWindowsInstallerConfig', () => {
    it('honors environment variables', async () => {
      const installerIconUrl = generateUUID();

      process.env.WIN_URL_ICON_INSTALLER = installerIconUrl;

      const {windowsInstallerConfig} = await buildWindowsInstallerConfig(wireJsonPath, envFilePath);

      assert.strictEqual(windowsInstallerConfig.installerIconUrl, installerIconUrl);

      delete process.env.WIN_URL_ICON_INSTALLER;
    });
  });

  describe('buildWindowsInstaller', () => {
    it('rejects when Squirrel packaging fails and restores wire.json', async () => {
      const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-squirrel-installer-test-'));
      const temporaryWireJsonPath = path.join(temporaryDirectory, 'wire.json');
      const originalWireJson = await fs.readFile(wireJsonPath, 'utf8');
      await fs.writeFile(temporaryWireJsonPath, originalWireJson);

      try {
        await assert.rejects(
          buildWindowsInstaller(temporaryWireJsonPath, envFilePath, {
            appDirectory: path.join(temporaryDirectory, 'missing-app-directory'),
            outputDirectory: path.join(temporaryDirectory, 'output'),
          } as ElectronWinstallerOptions),
        );
        assert.strictEqual(await fs.readFile(temporaryWireJsonPath, 'utf8'), originalWireJson);
      } finally {
        await fs.remove(temporaryDirectory);
      }
    });
  });
});

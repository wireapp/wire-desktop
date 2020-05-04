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
import * as path from 'path';
import {v4 as uuid} from 'uuid';

import {buildWindowsInstallerConfig} from './build-windows-installer';

const wireJsonPath = path.join(__dirname, '../../../electron/wire.json');
const envFilePath = path.join(__dirname, '../../../.env.defaults');

describe('build-windows-installer', () => {
  describe('buildWindowsInstallerConfig', () => {
    it('honors environment variables', async () => {
      const installerIconUrl = uuid();

      process.env.WIN_URL_ICON_INSTALLER = installerIconUrl;

      const {windowsInstallerConfig} = await buildWindowsInstallerConfig(wireJsonPath, envFilePath);

      assert.strictEqual(windowsInstallerConfig.installerIconUrl, installerIconUrl);

      delete process.env.WIN_URL_ICON_INSTALLER;
    });
  });
});

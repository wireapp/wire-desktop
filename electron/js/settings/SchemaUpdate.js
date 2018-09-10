/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

// @ts-check

const {app} = require('electron');
const debug = require('debug');
const fs = require('fs-extra');
const path = require('path');

const debugLogger = debug('UpgradeInitFile');
const settings = require('./ConfigurationPersistence');
const SettingsType = require('./SettingsType');

const getSetting = setting => settings.restore(setting, undefined);
const hasConfigVersion = typeof getSetting('configVersion') !== 'undefined';

const toVersion1 = (
  configFileV0 = path.join(app.getPath('userData'), 'init.json'),
  configFileV1 = path.join(app.getPath('userData'), 'config', 'init.json')
) => {
  if (fs.existsSync(configFileV0)) {
    fs.moveSync(configFileV0, configFileV1);
    if (hasConfigVersion) {
      try {
        [SettingsType.FULL_SCREEN, SettingsType.WINDOW_BOUNDS].forEach(setting => {
          if (typeof getSetting(setting) !== 'undefined') {
            settings.delete(setting);
            debugLogger(`Deleted "${setting}" property from old init file.`);
          }
        });
      } catch (error) {
        debugLogger(error);
      }
    }
  }
};

module.exports = {toVersion1};

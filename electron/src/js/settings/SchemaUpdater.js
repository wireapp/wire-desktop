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

const app = require('electron').app || require('electron').remote.app;
const debug = require('debug');
const fs = require('fs-extra');
const path = require('path');
const SettingsType = require('./SettingsType');

const debugLogger = debug('SchemaUpdate');
const defaultPathV0 = path.join(app.getPath('userData'), 'init.json');
const defaultPathV1 = path.join(app.getPath('userData'), 'config', 'init.json');

class SchemaUpdater {
  static get SCHEMATA() {
    return {
      VERSION_1: {
        configVersion: 1,
      },
    };
  }

  static updateToVersion1(configFileV0 = defaultPathV0, configFileV1 = defaultPathV1) {
    const config = SchemaUpdater.SCHEMATA.VERSION_1;

    if (fs.existsSync(configFileV0)) {
      try {
        fs.moveSync(configFileV0, configFileV1, {overwrite: true});
        Object.assign(config, fs.readJSONSync(configFileV1));
      } catch (error) {
        debugLogger(`Could not upgrade "${configFileV0}" to "${configFileV1}": ${error.message}`, error);
      }

      const getSetting = setting => (config.hasOwnProperty(setting) ? config[setting] : undefined);
      const hasNoConfigVersion = typeof getSetting('configVersion') === 'undefined';

      if (hasNoConfigVersion) {
        [SettingsType.FULL_SCREEN, SettingsType.WINDOW_BOUNDS].forEach(setting => {
          if (typeof getSetting(setting) !== 'undefined') {
            delete config[setting];
            debugLogger(`Deleted "${setting}" property from old init file.`);
          }
        });
      }

      try {
        fs.writeJsonSync(configFileV1, config, {spaces: 2});
      } catch (error) {
        debugLogger(`Failed to write config to "${configFileV1}": ${error.message}`, error);
      }
    }

    return configFileV1;
  }
}

module.exports = SchemaUpdater;

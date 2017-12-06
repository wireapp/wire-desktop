/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

'use strict';

const fs = require('fs');
const path = require('path');

const app = require('electron').app || require('electron').remote.app;
const debug = require('debug');

const INIT_JSON = path.join(app.getPath('userData'), 'init.json');

class ConfigurationPersistence {
  constructor() {
    this.debug = debug('ConfigurationPersistence');

    if (typeof global._ConfigurationPersistence === 'undefined') {
      this.debug('Reading config file');

      try {
        global._ConfigurationPersistence = this._readFromFile();
      } catch (error) {
        this.debug('Unable to parse the init file. Details: %s', error);
        global._ConfigurationPersistence = {};
      }
    }

    this.debug('Init ConfigurationPersistence');
  }

  save(name, value) {
    this.debug('Saving %s with "%o" as value', name, value);
    global._ConfigurationPersistence[name] = value;
    return true;
  }

  restore(name, defaultValue) {
    this.debug('Restoring %s', name);
    const value = global._ConfigurationPersistence[name];
    return (typeof value !== 'undefined' ? value : defaultValue);
  }

  persistToFile() {
    return new Promise((resolve, reject) => {
      const dataInJSON = JSON.stringify(global._ConfigurationPersistence);

      if (dataInJSON) {
        this.debug('Saving configuration to persistent storage: %o', dataInJSON);

        return fs.writeFile(INIT_JSON, dataInJSON, 'utf8', (error, data) => {
          if (error) {
            this.debug('An error occurred while persisting the configuration: %s', error);
            return reject(error);
          }

          resolve(data);
        });
      }

      this.debug('No configuration found to persist');
      resolve();
    });
  }

  _readFromFile() {
    this.debug('Reading user configuration file...');
    const dataInJSON = JSON.parse(fs.readFileSync(INIT_JSON, 'utf8'));
    this.debug('%o', dataInJSON);
    return dataInJSON;
  }
}

module.exports = new ConfigurationPersistence();

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

import * as debug from 'debug';
import * as fs from 'fs-extra';
import {SchemaUpdater} from './SchemaUpdater';

declare var global: any;

class ConfigurationPersistence {
  configFile: string;
  debug: debug.IDebugger;

  constructor() {
    this.configFile = SchemaUpdater.updateToVersion1();
    this.debug = debug('ConfigurationPersistence');

    if (typeof global._ConfigurationPersistence === 'undefined') {
      global._ConfigurationPersistence = this.readFromFile();
    }

    this.debug('Init ConfigurationPersistence');
  }

  delete(name) {
    this.debug('Deleting %s', name);
    delete global._ConfigurationPersistence[name];
    return true;
  }

  save(name, value) {
    this.debug('Saving %s with value "%o"', name, value);
    global._ConfigurationPersistence[name] = value;
    return true;
  }

  restore(name, defaultValue) {
    this.debug('Restoring %s', name);
    const value = global._ConfigurationPersistence[name];
    return typeof value !== 'undefined' ? value : defaultValue;
  }

  persistToFile() {
    this.debug('Saving configuration to persistent storage: %o', global._ConfigurationPersistence);
    try {
      return fs.writeJsonSync(this.configFile, global._ConfigurationPersistence, {spaces: 2});
    } catch (error) {
      this.debug('An error occurred while persisting the configuration: %s', error);
    }
  }

  readFromFile() {
    this.debug(`Reading config file "${this.configFile}"...`);
    try {
      return fs.readJSONSync(this.configFile);
    } catch (error) {
      // In case of an error, always use the latest schema with sensible defaults:
      return SchemaUpdater.SCHEMATA[
        Object.keys(SchemaUpdater.SCHEMATA)[Object.keys(SchemaUpdater.SCHEMATA).length - 1]
      ];
    }
  }
}

const settings = new ConfigurationPersistence();

export {settings};

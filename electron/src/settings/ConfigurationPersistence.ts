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

import * as fs from 'fs-extra';
import * as logdown from 'logdown';

import * as path from 'node:path';

import {SchemaUpdater} from './SchemaUpdater';

import {getLogger} from '../logging/getLogger';

class ConfigurationPersistence {
  private readonly configFile: string;
  private readonly logger: logdown.Logger;

  constructor() {
    this.configFile = SchemaUpdater.updateToVersion1();
    this.logger = getLogger(path.basename(__filename));

    if (globalThis._ConfigurationPersistence === undefined) {
      globalThis._ConfigurationPersistence = this.readFromFile();
    }

    this.logger.info('Initializing ConfigurationPersistence');
  }

  delete(name: string): true {
    this.logger.info(`Deleting "${name}"`);
    delete globalThis._ConfigurationPersistence[name];
    return true;
  }

  save<T>(name: string, value: T): true {
    this.logger.info(`Saving "${name}" with value:`, value);
    globalThis._ConfigurationPersistence[name] = value;
    return true;
  }

  restore<T>(name: string, defaultValue?: T): T {
    this.logger.info(`Restoring "${name}"`);
    const value = globalThis._ConfigurationPersistence[name];
    return value !== undefined ? value : (defaultValue as T);
  }

  persistToFile(): void {
    this.logger.info(
      `Saving configuration to persistent storage in "${this.configFile}":`,
      globalThis._ConfigurationPersistence,
    );
    try {
      return fs.outputJsonSync(this.configFile, globalThis._ConfigurationPersistence, {spaces: 2});
    } catch (error) {
      this.logger.error('An error occurred while persisting the configuration', error);
    }
  }

  readFromFile(): Record<string, any> {
    this.logger.info(`Reading config file from "${this.configFile}" ...`);
    try {
      const configContent: Record<string, any> = fs.readJSONSync(this.configFile);
      this.logger.info('Read config:', JSON.stringify(configContent));
      return configContent;
    } catch (error) {
      this.logger.warn('No config found');
      const schemataKeys = Object.keys(SchemaUpdater.SCHEMATA);
      // In case of an error, always use the latest schema with sensible defaults:
      return SchemaUpdater.SCHEMATA[schemataKeys[schemataKeys.length - 1]];
    }
  }
}

export const settings = new ConfigurationPersistence();

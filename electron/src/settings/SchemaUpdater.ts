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

import * as Electron from 'electron';
import fs from 'fs-extra';

import * as path from 'node:path';

import {SettingsType} from './SettingsType';

import {getLogger} from '../logging/getLogger';

const app = Electron.app;

const logger = getLogger(path.basename(__filename));

const getDefaultPathV0 = (): string => {
  try {
    if (app?.getPath) {
      return path.join(app.getPath('userData'), 'init.json');
    }
  } catch (error) {
    logger.error('Failed to get user data path for V0 config:', error);
  }
  return path.join(process.cwd(), 'init.json');
};

const getDefaultPathV1 = (): string => {
  try {
    if (app?.getPath) {
      return path.join(app.getPath('userData'), 'config/init.json');
    }
  } catch (error) {
    logger.error('Failed to get user data path for V1 config:', error);
  }
  return path.join(process.cwd(), 'config/init.json');
};

export class SchemaUpdater {
  static SCHEMATA: Record<string, any> = {
    VERSION_1: {
      configVersion: 1,
    },
  };

  private static validateConfigPaths(resolvedV0: string, resolvedV1: string): void {
    if (resolvedV0.includes('..') || resolvedV1.includes('..')) {
      throw new Error('Invalid config file paths');
    }
  }

  private static migrateConfigFile(configFileV0: string, configFileV1: string, config: any): void {
    try {
      fs.moveSync(configFileV0, configFileV1, {overwrite: true});
      Object.assign(config, fs.readJSONSync(configFileV1));
    } catch (error) {
      logger.log(
        `Could not upgrade "${configFileV0}" to "${configFileV1}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        error,
      );
    }
  }

  private static cleanupLegacySettings(config: any): void {
    const configMap = new Map(Object.entries(config));
    const getSetting = (setting: string) => configMap.get(setting);
    const hasNoConfigVersion = getSetting('configVersion') === undefined;

    if (hasNoConfigVersion) {
      for (const setting of [SettingsType.FULL_SCREEN, SettingsType.WINDOW_BOUNDS]) {
        if (getSetting(setting) !== undefined) {
          configMap.delete(setting);
          logger.log(`Deleted "${setting}" property from old init file.`);
        }
      }
      Object.assign(config, Object.fromEntries(configMap));
    }
  }

  private static writeConfigFile(configFileV1: string, config: any): void {
    try {
      fs.writeJsonSync(configFileV1, config, {spaces: 2});
    } catch (error) {
      logger.log(
        `Failed to write config to "${configFileV1}": ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  static updateToVersion1(configFileV0 = getDefaultPathV0(), configFileV1 = getDefaultPathV1()): string {
    const config = SchemaUpdater.SCHEMATA.VERSION_1;

    const path = require('node:path');
    const resolvedV0 = path.resolve(configFileV0);
    const resolvedV1 = path.resolve(configFileV1);

    SchemaUpdater.validateConfigPaths(resolvedV0, resolvedV1);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(resolvedV0)) {
      SchemaUpdater.migrateConfigFile(resolvedV0, resolvedV1, config);
      SchemaUpdater.cleanupLegacySettings(config);
      SchemaUpdater.writeConfigFile(resolvedV1, config);
    }

    return configFileV1;
  }
}

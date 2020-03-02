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

import {app} from 'electron';
import * as fs from 'fs-extra';
import * as minimist from 'minimist';
import * as path from 'path';

import {getLogger} from './logging/getLogger';
import {Raygun} from './logging/initRaygun';
import {getLogFiles} from './logging/loggerUtils';
import * as EnvironmentUtil from './runtime/EnvironmentUtil';
import * as lifecycle from './runtime/lifecycle';
import {config} from './settings/config';
import {ApplicationHandler} from './ApplicationHandler';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron.log');

// Config
const argv = minimist(process.argv.slice(1));

const logger = getLogger(path.basename(__filename));

if (argv.version) {
  console.info(config.version);
  process.exit();
}

let applicationHandler: ApplicationHandler;

Object.entries(config).forEach(([key, value]) => {
  if (typeof value === 'undefined' || (typeof value === 'number' && isNaN(value))) {
    logger.warn(`Configuration key "${key}" not defined.`);
  }
});

// Squirrel setup
app.setAppUserModelId(`com.squirrel.wire.${config.name.toLowerCase()}`);

const renameFileExtensions = (files: string[], oldExtension: string, newExtension: string): void => {
  for (const file of files) {
    try {
      const fileStat = fs.statSync(file);
      if (fileStat.isFile() && file.endsWith(oldExtension)) {
        fs.renameSync(file, file.replace(oldExtension, newExtension));
      }
    } catch (error) {
      logger.error(`Failed to rename log file: "${error.message}"`);
    }
  }
};

const renameWebViewLogFiles = (): void => {
  // Rename "console.log" to "console.old" (for every log directory of every account)
  try {
    const logFiles = getLogFiles(LOG_DIR, true);
    renameFileExtensions(logFiles, '.log', '.old');
  } catch (error) {
    logger.log(`Failed to read log directory with error: ${error.message}`);
  }
};

const addLinuxWorkarounds = () => {
  if (EnvironmentUtil.platform.IS_LINUX) {
    // Fix indicator icon on Unity
    // Source: https://bugs.launchpad.net/ubuntu/+bug/1559249

    if (
      EnvironmentUtil.linuxDesktop.isUbuntuUnity ||
      EnvironmentUtil.linuxDesktop.isPopOS ||
      EnvironmentUtil.linuxDesktop.isGnomeX11
    ) {
      process.env.XDG_CURRENT_DESKTOP = 'Unity';
    }
  }
};

const handlePortableFlags = () => {
  if (argv.user_data_dir || argv.portable) {
    const USER_PATH = argv.user_data_dir
      ? path.resolve(argv.user_data_dir)
      : path.join(process.env.APPIMAGE || process.execPath, '../Data');

    logger.log(`Saving user data to "${USER_PATH}".`);
    app.setPath('userData', USER_PATH);
  }
};

Raygun.initClient();
handlePortableFlags();
lifecycle.checkSingleInstance();
lifecycle.checkForUpdate().catch(error => logger.error(error));

// Stop further execution on update to prevent second tray icon
if (lifecycle.isFirstInstance) {
  addLinuxWorkarounds();
  applicationHandler = new ApplicationHandler();
  applicationHandler.run();
  renameWebViewLogFiles();
  fs.ensureFileSync(LOG_FILE);
}

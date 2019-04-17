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

// https://github.com/atom/atom/blob/ce18e1b7d65808c42df5b612d124935ab5c06490/src/main-process/squirrel-update.js

import {app} from 'electron';

import * as cp from 'child_process';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import * as lifecycle from '../runtime/lifecycle';
import {config} from '../settings/config';

type SpawnCallback = (error: SpawnError | null, stdout: string) => void;
type SpawnError = Error & {code?: number | null; stdout?: string | null};

app.setAppUserModelId(`com.squirrel.wire.${config.name.toLowerCase()}`);

const logger = getLogger('squirrel');

const appFolder = path.resolve(process.execPath, '..');
const rootFolder = path.resolve(appFolder, '..');
const updateDotExe = path.join(rootFolder, 'Update.exe');

const exeName = `${config.name}.exe`;
const linkName = `${config.name}.lnk`;
const windowsAppData = process.env.APPDATA || '';

if (!windowsAppData && EnvironmentUtil.platform.IS_WINDOWS) {
  logger.error('No Windows AppData directory found.');
}

const taskbarLink = path.resolve(windowsAppData, 'Microsoft/Internet Explorer/Quick Launch/User Pinned/TaskBar');

const shortcutLink = path.resolve(taskbarLink, linkName);

const SQUIRREL_EVENT = {
  CREATE_SHORTCUT: '--createShortcut',
  INSTALL: '--squirrel-install',
  OBSOLETE: '--squirrel-obsolete',
  REMOVE_SHORTCUT: '--removeShortcut',
  UNINSTALL: '--squirrel-uninstall',
  UPDATE: '--update',
  UPDATED: '--squirrel-updated',
};

const spawn = (command: string, args: string[], callback?: SpawnCallback) => {
  let error: SpawnError | null;
  let spawnedProcess;
  let stdout = '';

  try {
    spawnedProcess = cp.spawn(command, args);
  } catch (_error) {
    error = _error;
    return process.nextTick(() => (typeof callback === 'function' ? callback(error, stdout) : void 0));
  }

  if (spawnedProcess.stdout) {
    spawnedProcess.stdout.on('data', data => (stdout += data));
  }

  error = null;
  spawnedProcess.on('error', processError => (error != null ? error : (error = processError)));
  spawnedProcess.on('close', (code, signal) => {
    if (code !== 0) {
      if (error == null) {
        error = new Error(`Command failed: ${signal != null ? signal : code}`);
      }
    }
    if (error != null) {
      if (error.code == null) {
        error.code = code;
      }
    }
    if (error != null) {
      if (error.stdout == null) {
        error.stdout = stdout;
      }
    }
    return typeof callback === 'function' ? callback(error, stdout) : void 0;
  });
};

const spawnUpdate = (args: string[], callback?: SpawnCallback): void => {
  logger.info(`Installing update ...`);
  spawn(updateDotExe, args, callback);
};

const createStartShortcut = (callback?: SpawnCallback): void => {
  logger.info(`Creating shortcut in the start menu ...`);
  spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=StartMenu'], callback);
};

const createDesktopShortcut = (callback?: SpawnCallback): void => {
  logger.info(`Creating shortcut on the desktop ...`);
  spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=Desktop'], callback);
};

const removeShortcuts = (callback: (err: NodeJS.ErrnoException) => void): void => {
  logger.info(`Removing all shortcuts ...`);
  spawnUpdate([SQUIRREL_EVENT.REMOVE_SHORTCUT, exeName, '-l=Desktop,Startup,StartMenu'], () =>
    fs.unlink(shortcutLink, callback)
  );
};

const installUpdate = (): void => {
  logger.info(`Checking for updates on "${EnvironmentUtil.app.UPDATE_URL_WIN}" ...`);
  spawnUpdate([SQUIRREL_EVENT.UPDATE, EnvironmentUtil.app.UPDATE_URL_WIN]);
};

const scheduleUpdate = (): void => {
  const pluralize = (num: number, str: string) => `${num} ${str + (num === 1 ? '' : 's')}`;
  const nextCheck = moment.duration(config.squirrelUpdateInterval.DELAY).asMinutes();
  const everyCheck = moment.duration(config.squirrelUpdateInterval.INTERVAL).asHours();
  logger.info(
    `Scheduling update to check in "${pluralize(nextCheck, 'minute')}" and every "${pluralize(everyCheck, 'hour')}" ...`
  );

  setTimeout(installUpdate, config.squirrelUpdateInterval.DELAY);
  setInterval(installUpdate, config.squirrelUpdateInterval.INTERVAL);
};

const handleSquirrelEvent = (isFirstInstance?: boolean): boolean | void => {
  const [, squirrelEvent] = process.argv;

  switch (squirrelEvent) {
    case SQUIRREL_EVENT.INSTALL: {
      createStartShortcut(() => {
        createDesktopShortcut(() => {
          lifecycle.quit();
        });
      });
      return true;
    }

    case SQUIRREL_EVENT.UPDATED: {
      lifecycle.quit();
      return true;
    }

    case SQUIRREL_EVENT.UNINSTALL: {
      removeShortcuts(() => lifecycle.quit());
      return true;
    }

    case SQUIRREL_EVENT.OBSOLETE: {
      lifecycle.quit();
      return true;
    }
  }

  if (!isFirstInstance) {
    return lifecycle.quit();
  }

  scheduleUpdate();
};

export const Squirrel = {handleSquirrelEvent, installUpdate};

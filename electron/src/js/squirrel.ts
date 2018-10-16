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

// https://github.com/atom/atom/blob/master/src/main-process/squirrel-update.js

import {app} from 'electron';

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as config from './config';
import * as environment from './environment';
import * as lifecycle from './lifecycle';

import {SpawnCallback, SpawnError} from '../interfaces';

app.setAppUserModelId(`com.squirrel.wire.${config.NAME.toLowerCase()}`);

const appFolder = path.resolve(process.execPath, '..');
const rootFolder = path.resolve(appFolder, '..');
const updateDotExe = path.join(rootFolder, 'Update.exe');

const exeName = `${config.NAME}.exe`;
const linkName = `${config.NAME}.lnk`;

const taskbarLink = path.resolve(
  process.env.APPDATA || '',
  'Microsoft',
  'Internet Explorer',
  'Quick Launch',
  'User Pinned',
  'TaskBar',
  linkName
);

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

  spawnedProcess.stdout.on('data', data => (stdout += data));

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
  spawn(updateDotExe, args, callback);
};

const createStartShortcut = (callback?: SpawnCallback): void => {
  spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=StartMenu'], callback);
};

const createDesktopShortcut = (callback?: SpawnCallback): void => {
  spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=Desktop'], callback);
};

const removeShortcuts = (callback: (err: NodeJS.ErrnoException) => void): void => {
  spawnUpdate([SQUIRREL_EVENT.REMOVE_SHORTCUT, exeName, '-l=Desktop,Startup,StartMenu'], () =>
    fs.unlink(taskbarLink, callback)
  );
};

const installUpdate = (): void => {
  spawnUpdate([SQUIRREL_EVENT.UPDATE, environment.app.UPDATE_URL_WIN]);
};

const scheduleUpdate = (): void => {
  setTimeout(installUpdate, config.UPDATE.DELAY);
  setInterval(installUpdate, config.UPDATE.INTERVAL);
};

const handleSquirrelEvent = (shouldQuit: boolean): boolean | void => {
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

  if (shouldQuit) {
    return lifecycle.quit();
  }

  scheduleUpdate();
};

export {handleSquirrelEvent, installUpdate};

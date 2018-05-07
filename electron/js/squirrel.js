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

// https://github.com/atom/atom/blob/master/src/main-process/squirrel-update.coffee

const {app} = require('electron');

const config = require('./config');
const cp = require('child_process');
const environment = require('./environment');
const lifecycle = require('./lifecycle');
const fs = require('fs');
const path = require('path');

app.setAppUserModelId('com.squirrel.wire.' + config.NAME.toLowerCase());

let appFolder = path.resolve(process.execPath, '..');
let rootFolder = path.resolve(appFolder, '..');
let updateDotExe = path.join(rootFolder, 'Update.exe');

let exeName = config.NAME + '.exe';
let linkName = config.NAME + '.lnk';

let taskbarLink = path.resolve(
  path.join(process.env.APPDATA, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar', linkName)
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

const spawn = (command, args, callback) => {
  let error;
  let spawnedProcess;
  let stdout;
  stdout = '';

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
        error = new Error('Command failed: ' + (signal != null ? signal : code));
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

const spawnUpdate = (args, callback) => {
  spawn(updateDotExe, args, callback);
};

const createStartShortcut = callback => {
  spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=StartMenu'], callback);
};

const createDesktopShortcut = callback => {
  spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=Desktop'], callback);
};

const removeShortcuts = callback => {
  spawnUpdate([SQUIRREL_EVENT.REMOVE_SHORTCUT, exeName, '-l=Desktop,Startup,StartMenu'], () =>
    fs.unlink(taskbarLink, callback)
  );
};

const installUpdate = () => {
  spawnUpdate([SQUIRREL_EVENT.UPDATE, environment.app.UPDATE_URL_WIN]);
};

const scheduleUpdate = () => {
  setTimeout(installUpdate, config.UPDATE.DELAY);
  setInterval(installUpdate, config.UPDATE.INTERVAL);
};

const handleSquirrelEvent = shouldQuit => {
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

module.exports = {
  handleSquirrelEvent,
  installUpdate,
};

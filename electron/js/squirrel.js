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


// https://github.com/atom/atom/blob/master/src/main-process/squirrel-update.coffee

const {app} = require('electron');

const config = require('./config');
const cp = require('child_process');
const environment = require('./environment');
const fs = require('fs');
const path = require('path');

app.setAppUserModelId('com.squirrel.wire.' + config.NAME.toLowerCase());

let appFolder = path.resolve(process.execPath, '..');
let rootFolder = path.resolve(appFolder, '..');
let updateDotExe = path.join(rootFolder, 'Update.exe');

let exeName = config.NAME + '.exe';
let linkName = config.NAME + '.lnk';

let taskbarLink = path.resolve(path.join(process.env.APPDATA, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar', linkName));

const spawn = (command, args, callback) => {
  let error;
  let spawnedProcess;
  let stdout;
  stdout = '';

  try {
    spawnedProcess = cp.spawn(command, args);
  } catch (_error) {
    error = _error;
    process.nextTick(function() {
      return typeof callback === 'function' ? callback(error, stdout) : void 0;
    });
    return;
  };

  spawnedProcess.stdout.on('data', function(data) {
    return stdout += data;
  });

  error = null;
  spawnedProcess.on('error', function(processError) {
    return error != null ? error : error = processError;
  });

  spawnedProcess.on('close', function(code, signal) {
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


const createStartShortcut = (callback) => {
  spawnUpdate(['--createShortcut', exeName, '-l=StartMenu'], callback);
};


const createDesktopShortcut = (callback) =>  {
  spawnUpdate(['--createShortcut', exeName, '-l=Desktop'], callback);
};


const removeShortcuts = (callback) => {
  spawnUpdate(['--removeShortcut', exeName, '-l=Desktop,Startup,StartMenu'], () => fs.unlink(taskbarLink, callback));
};


const installUpdate = () => {
  spawnUpdate(['--update', environment.app.UPDATE_URL_WIN]);
};


const scheduleUpdate = () => {
  setTimeout(installUpdate, config.UPDATE.DELAY);
  setInterval(installUpdate, config.UPDATE.INTERVAL);
};


const handleSquirrelEvent = (shouldQuit) => {
  const [, squirrelEvent] = process.argv;

  switch (squirrelEvent) {
    case '--squirrel-install':
      createStartShortcut(() => {
        createDesktopShortcut(() => {
          app.quit();
        });
      });
      return true;
    case '--squirrel-updated':
      app.exit();
      return true;
    case '--squirrel-uninstall':
      removeShortcuts(() => {
        app.quit();
      });
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
  if (shouldQuit) {
    // Using exit instead of quit for the time being
    // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
    app.exit();
  }
  scheduleUpdate();
  return false;
};


module.exports = {
  installUpdate: installUpdate,
  handleSquirrelEvent: handleSquirrelEvent,
};

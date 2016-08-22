/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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

// https://github.com/atom/atom/blob/master/src/browser/squirrel-update.coffee

'use strict';

const {app} = require('electron');

const config = require('./config');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

app.setAppUserModelId('com.squirrel.wire.' + config.NAME.toLowerCase());

let appFolder = path.resolve(process.execPath, '..');
let rootFolder = path.resolve(appFolder, '..');
let updateDotExe = path.join(rootFolder, 'Update.exe');

let exeName = config.NAME + '.exe';
let linkName = config.NAME + '.lnk';

let homeFolder = path.resolve(process.env.HOMEPATH);

let startFolder = path.resolve(path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs'));
let startupFolder = path.resolve(path.join(startFolder, 'Startup'));
let taskbarFolder = path.resolve(path.join(process.env.APPDATA, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar'));

let startLink = path.resolve(path.join(startFolder, config.NAME, linkName));
let startupLink = path.resolve(path.join(startupFolder, linkName));
let desktopLink = path.join(homeFolder, 'Desktop', linkName);
let taskbarLink = path.join(taskbarFolder, linkName);

function spawn(command, args, callback) {
  var error;
  var spawnedProcess;
  var stdout;
  stdout = '';

  try {
    spawnedProcess = cp.spawn(command, args);
  } catch (_error) {
    error = _error;
    process.nextTick(function() {
      return typeof callback === 'function' ? callback(error, stdout) : void 0;
    });
    return;
  }

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


function spawnUpdate(args, callback) {
  spawn(updateDotExe, args, callback);
};


function startupLinkExists(callback) {
  fs.exists(startupLink, function(exists) {
    callback(exists);
  });
}


function createStartShortcut(callback) {
  spawnUpdate(['--createShortcut', exeName, '-l=StartMenu'], callback);
};


function createDesktopShortcut(callback) {
  spawnUpdate(['--createShortcut', exeName, '-l=Desktop'], callback);
};


function createStartupShortcut(callback) {
  spawnUpdate(['--createShortcut', exeName, '-l=Startup'], callback);
};


function updateDesktopShortcut(callback) {
  fs.exists(desktopLink, function(exists) {
    if (exists) {
      createDesktopShortcut(callback);
    }
  });
};


function updateStartupShortcut(callback) {
  fs.exists(startupLink, function(exists) {
    if (exists) {
      createStartupShortcut(callback);
    }
  });
};


function updateTaskbarShortcut(callback) {
  fs.exists(taskbarLink, function(exists) {
    if (exists) {
      createStartShortcut(function() {
        fs.createReadStream(startLink).pipe(fs.createWriteStream(taskbarLink));
      });
    }
  });
};


function removeShortcuts(callback) {
  spawnUpdate(['--removeShortcut', exeName, '-l=Desktop,Startup,StartMenu'], function() {
    fs.unlink(taskbarLink, callback);
  });
};


function removeStartupShortcut(callback) {
  spawnUpdate(['--removeShortcut', exeName, '-l=Startup'], callback);
};


function updateSelfWin(callback) {
  spawnUpdate(['--update', config.UPDATE_WIN_URL], callback);
}


function handleSquirrelEvent(shouldQuit, callback) {
  var squirrelEvent = process.argv[1];
  callback(squirrelEvent);
  switch (squirrelEvent) {
    case '--squirrel-install':
      createStartShortcut(function() {
        createDesktopShortcut(function() {
          createStartupShortcut(function() {
            app.quit();
          });
        });
      });
      return true;
    case '--squirrel-updated':
      // TODO (lipis): don't createStartup shortcut in the next prod release
      updateDesktopShortcut(function() {
        updateTaskbarShortcut(function() {
          updateStartupShortcut(function() {
            app.quit();
          });
        });
      });
      return true;
    case '--squirrel-uninstall':
      removeShortcuts(function() {
        app.quit();
      });
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
  updateSelfWin();
  if (shouldQuit) {
    app.quit();
  }
  updateTaskbarShortcut();
  return false;
}

module.exports = {
  handleSquirrelEvent: handleSquirrelEvent,
  createStartupShortcut: createStartupShortcut,
  removeStartupShortcut: removeStartupShortcut,
  startupLinkExists: startupLinkExists
};

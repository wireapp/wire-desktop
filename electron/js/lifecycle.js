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

const {app, ipcMain} = require('electron');
const environment = require('./environment');
const EVENT_TYPE = require('./lib/eventType');
const settings = require('./lib/settings');
const windowManager = require('./window-manager');

const checkForUpdate = () => {
  if (environment.platform.IS_WINDOWS) {
    const squirrel = require('./squirrel');
    squirrel.handleSquirrelEvent(shouldQuit);

    ipcMain.on(EVENT_TYPE.WRAPPER.UPDATE, () => squirrel.installUpdate());
  }
};

const checkSingleInstance = () => {
  if (!environment.platform.IS_MAC_OS) {
    // makeSingleInstance will crash the signed mas app
    // see: https://github.com/atom/electron/issues/4688
    shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
      windowManager.showPrimaryWindow();
      return true;
    });
  }

  if (!environment.platform.IS_WINDOWS && shouldQuit) {
    quit();
  }
};

// Using exit instead of quit for the time being
// see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
const quit = async () => {
  await settings.persistToFile();
  app.exit();
};

const relaunch = () => {
  app.relaunch();
  quit();
};

let shouldQuit = false;

module.exports = {
  checkForUpdate,
  checkSingleInstance,
  quit,
  relaunch,
  shouldQuit,
};

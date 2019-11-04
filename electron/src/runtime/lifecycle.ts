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

import {app, ipcMain} from 'electron';
import * as path from 'path';

import {EVENT_TYPE} from '../lib/eventType';
import {getLogger} from '../logging/getLogger';
import {settings} from '../settings/ConfigurationPersistence';
import {Squirrel} from '../update/Squirrel';
import * as WindowManager from '../window/WindowManager';
import * as EnvironmentUtil from './EnvironmentUtil';

const logger = getLogger(path.basename(__filename));

export let isFirstInstance: boolean | undefined = undefined;

export const checkForUpdate = () => {
  if (EnvironmentUtil.platform.IS_WINDOWS) {
    logger.info('Checking for Windows update ...');
    Squirrel.handleSquirrelEvent(isFirstInstance);

    ipcMain.on(EVENT_TYPE.WRAPPER.UPDATE, () => Squirrel.installUpdate());
  }
};

export const checkSingleInstance = () => {
  if (process.mas) {
    isFirstInstance = true;
  } else {
    isFirstInstance = app.requestSingleInstanceLock();
    logger.info('Checking if we are the first instance...', isFirstInstance);

    if (!EnvironmentUtil.platform.IS_WINDOWS && !isFirstInstance) {
      quit();
    } else {
      app.on('second-instance', () => WindowManager.showPrimaryWindow());
    }
  }
};

// Using exit instead of quit for the time being
// see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
export const quit = () => {
  logger.info('Initiating app quit ...');
  settings.persistToFile();

  logger.info('Exiting ...');
  app.exit();
};

export const relaunch = () => {
  logger.info('Relaunching the app ...');
  if (EnvironmentUtil.platform.IS_MAC_OS) {
    /*
     * on MacOS, it is not possible to relaunch the app, so just fallback
     * to reloading all the webviews
     * see: https://github.com/electron/electron/issues/13696
     */
    WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.WRAPPER.RELOAD);
  } else {
    app.relaunch();
    quit();
  }
};

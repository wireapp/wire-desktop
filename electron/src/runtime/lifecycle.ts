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

import {app, session, ipcMain, WebContents} from 'electron';

import * as path from 'path';

import {ValidationUtil} from '@wireapp/commons';

import * as EnvironmentUtil from './EnvironmentUtil';

import {EVENT_TYPE} from '../lib/eventType';
import {getLogger} from '../logging/getLogger';
import {settings} from '../settings/ConfigurationPersistence';
import * as Squirrel from '../update/squirrel';
import {WindowManager} from '../window/WindowManager';

const logger = getLogger(path.basename(__filename));

export let isFirstInstance: boolean | undefined = undefined;

const relaunchListeners: (() => void)[] = [];

export async function initSquirrelListener(): Promise<void> {
  if (EnvironmentUtil.platform.IS_WINDOWS) {
    logger.info('Checking for Windows update ...');
    await Squirrel.handleSquirrelArgs();

    ipcMain.on(EVENT_TYPE.WRAPPER.UPDATE, () => Squirrel.installUpdate());
  }
}

export const checkSingleInstance = async () => {
  if (process.mas) {
    isFirstInstance = true;
  } else {
    isFirstInstance = app.requestSingleInstanceLock();
    logger.info('Checking if we are the first instance ...', isFirstInstance);

    if (!EnvironmentUtil.platform.IS_WINDOWS && !isFirstInstance) {
      await quit();
    } else {
      app.on('second-instance', () => WindowManager.showPrimaryWindow());
    }
  }
};

export const getWebViewId = (contents?: WebContents): string | undefined => {
  if (!contents) {
    return undefined;
  }
  try {
    const currentLocation = new URL(contents.getURL());
    const webViewId = currentLocation.searchParams.get('id');
    return webViewId && ValidationUtil.isUUIDv4(webViewId) ? webViewId : undefined;
  } catch (error) {
    return undefined;
  }
};

/**
 * will register a function that will be called in case of a relaunch in MacOS (see https://github.com/electron/electron/issues/13696)
 * @param {Function} listener the listener to register
 * @returns {void}
 */
export const addRelaunchListeners = (listener: () => void) => {
  relaunchListeners.push(listener);
};

export const quit = async (clearCache = false): Promise<void> => {
  logger.info('Initiating app quit ...');
  settings.persistToFile();

  if (clearCache) {
    logger.info('Clearing cache ...');

    try {
      await session.defaultSession?.clearCache();
    } catch (error) {
      logger.error(error);
    }
  }

  logger.info('Exiting ...');
  app.quit();
};

export const relaunch = async () => {
  logger.info('Relaunching the app ...');
  if (EnvironmentUtil.platform.IS_MAC_OS) {
    /*
     * on MacOS, it is not possible to relaunch the app, so just fallback
     * to reloading all the webviews
     * see: https://github.com/electron/electron/issues/13696
     */
    relaunchListeners.forEach(listener => listener());
  } else {
    app.relaunch();
    await quit();
  }
};

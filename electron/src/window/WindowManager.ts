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

import {BrowserWindow, app} from 'electron';
import * as path from 'path';

import {WebViewFocus} from '../lib/webViewFocus';
import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

let primaryWindowId: number | undefined;

export const getPrimaryWindow = (): BrowserWindow | void => {
  const [primaryWindow] = primaryWindowId ? [BrowserWindow.fromId(primaryWindowId)] : BrowserWindow.getAllWindows();
  if (primaryWindow) {
    logger.info(`Got primaryWindow with ID "${primaryWindow.id}"`);
    return primaryWindow;
  }
};

export const setPrimaryWindowId = (newPrimaryWindowId: number): void => {
  logger.info(`Setting primary window ID to "${newPrimaryWindowId}" ...`);
  primaryWindowId = newPrimaryWindowId;
};

export const showPrimaryWindow = (): void => {
  const browserWindow = getPrimaryWindow();

  if (browserWindow) {
    if (browserWindow.isMinimized()) {
      browserWindow.restore();
    } else if (!browserWindow.isVisible()) {
      browserWindow.show();
    }

    browserWindow.focus();
  }
};

export const sendActionToPrimaryWindow = (channel: string, ...args: any[]): void => {
  const primaryWindow = getPrimaryWindow();

  if (primaryWindow) {
    logger.info(`Sending action "${channel}" to window with ID "${primaryWindow.id}":`, ...args);
    const focusedWebContents = WebViewFocus.getFocusedWebContents();
    if (focusedWebContents) {
      logger.info('Got focusedWebContents:', focusedWebContents.id);
      focusedWebContents.send(channel, ...args);
    } else {
      logger.info('Got no focusedWebContents, using primaryWindow webContents:', primaryWindow.webContents.id);
      primaryWindow.webContents.send(channel, ...args);
    }
  }
};

export const sendActionAndFocusWindow = async (channel: string, ...args: any[]) => {
  await app.whenReady();

  const primaryWindow = getPrimaryWindow();

  if (primaryWindow) {
    if (primaryWindow.webContents.isLoading()) {
      primaryWindow.webContents.once('did-finish-load', () => primaryWindow.webContents.send(channel, ...args));
    } else {
      if (!primaryWindow.isVisible()) {
        primaryWindow.show();
        primaryWindow.focus();
      }
      primaryWindow.webContents.send(channel, ...args);
    }
  }
};

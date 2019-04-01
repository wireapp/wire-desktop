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

let primaryWindowId: number | undefined;

const getPrimaryWindow = () => {
  const [primaryWindow] = primaryWindowId ? [BrowserWindow.fromId(primaryWindowId)] : BrowserWindow.getAllWindows();
  return primaryWindow;
};

const setPrimaryWindowId = (newPrimaryWindowId: number): void => {
  primaryWindowId = newPrimaryWindowId;
};

const showPrimaryWindow = (): void => {
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

const sendActionToPrimaryWindow = (channel: string, ...args: any[]): void => {
  const primaryWindow = getPrimaryWindow();
  if (primaryWindow) {
    primaryWindow.webContents.send(channel, ...args);
  }
};

const sendActionAndFocusWindow = async (channel: string, ...args: any[]) => {
  await app.whenReady();
  const main = getPrimaryWindow();
  if (main.webContents.isLoading()) {
    main.webContents.once('did-finish-load', () => {
      main.webContents.send(channel, ...args);
    });
  } else {
    if (!main.isVisible()) {
      main.show();
      main.focus();
    }
    main.webContents.send(channel, ...args);
  }
};

export const WindowManager = {
  getPrimaryWindow,
  sendActionAndFocusWindow,
  sendActionToPrimaryWindow,
  setPrimaryWindowId,
  showPrimaryWindow,
};

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

import {BaseWindow, BrowserWindow, screen, shell} from 'electron';

import * as path from 'path';
import {URL} from 'url';

import {showWarningDialog} from '../lib/showDialog';
import * as locale from '../locale';
import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger(path.basename(__filename));

interface Rectangle {
  height: number;
  width: number;
  x: number;
  y: number;
}

export const pointInRectangle = (point: [number, number], rectangle: Rectangle): boolean => {
  const [xCoordinate, yCoordinate] = point;
  const xInRange = xCoordinate >= rectangle.x && xCoordinate <= rectangle.x + rectangle.width;
  const yInRange = yCoordinate >= rectangle.y && yCoordinate <= rectangle.y + rectangle.height;

  return xInRange && yInRange;
};

export const isInView = (win: BrowserWindow): boolean => {
  const windowBounds = win.getBounds();
  const nearestWorkArea = screen.getDisplayMatching(windowBounds).workArea;

  const upperLeftVisible = pointInRectangle([windowBounds.x, windowBounds.y], nearestWorkArea);
  const lowerRightVisible = pointInRectangle(
    [windowBounds.x + windowBounds.width, windowBounds.y + windowBounds.height],
    nearestWorkArea,
  );

  return upperLeftVisible || lowerRightVisible;
};

export const openExternal = async (url: string, httpsOnly: boolean = false): Promise<void> => {
  try {
    const urlProtocol = new URL(url).protocol || '';
    const allowedProtocols = ['https:'];

    if (!httpsOnly) {
      allowedProtocols.push('ftp:', 'http:', 'mailto:', `${config.customProtocolName}:`);
    }

    if (!allowedProtocols.includes(urlProtocol)) {
      logger.warn(`Prevented opening external URL "${url}".`);
      const dialogText = `${locale.getText('urlBlockedPromptText')}\n\n${url}`;
      showWarningDialog(dialogText);
      return;
    }

    await shell.openExternal(url);
  } catch (error) {
    logger.error(error);
  }
};

const isBrowserWindow = (baseWindow: unknown): baseWindow is BrowserWindow => {
  return baseWindow instanceof Object && 'webContents' in baseWindow;
};

export const sendToWebContents = (baseWindow: BaseWindow | undefined, channel: string, ...args: any[]) => {
  if (isBrowserWindow(baseWindow)) {
    try {
      baseWindow.webContents.send(channel, ...args);
    } catch (error) {
      logger.error('Failed to send event to webContents', error);
    }
  } else {
    logger.error("This action's target is not an instance of BrowserWindow.");
  }
};

export const getNewWindowOptions = ({
  parent,
  title = '',
  width,
  height,
  resizable = false,
  fullscreenable = false,
  maximizable = false,
  alwaysOnTop = true,
  minimizable = false,
  autoHideMenuBar = false,
}: {
  title?: string;
  parent?: Electron.BrowserWindow;
  width: number;
  height: number;
  resizable?: boolean;
  fullscreenable?: boolean;
  maximizable?: boolean;
  alwaysOnTop?: boolean;
  minimizable?: boolean;
  autoHideMenuBar?: boolean;
}): Electron.BrowserWindowConstructorOptions => ({
  alwaysOnTop,
  width,
  height,
  backgroundColor: '#FFFFFF',
  fullscreen: false,
  fullscreenable,
  maximizable,
  minimizable,
  modal: false,
  movable: true,
  parent,
  resizable,
  minHeight: height,
  minWidth: width,
  title: title,
  titleBarStyle: 'default',
  useContentSize: true,
  autoHideMenuBar,
  webPreferences: {
    allowRunningInsecureContent: false,
    backgroundThrottling: false,
    contextIsolation: true,
    devTools: false,
    disableBlinkFeatures: '',
    experimentalFeatures: false,
    images: true,
    javascript: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    offscreen: false,
    partition: '',
    plugins: false,
    preload: '',
    sandbox: true,
    scrollBounce: true,
    spellcheck: false,
    textAreasAreResizable: false,
    webSecurity: true,
    webgl: false,
    webviewTag: false,
  },
});

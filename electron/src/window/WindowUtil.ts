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

import {BrowserWindow, screen, shell} from 'electron';
import * as path from 'path';
import * as URL from 'url';

import {getLogger} from '../logging/getLogger';
import {showWarningDialog} from '../lib/showDialog';
import * as locale from '../locale/locale';
import {config} from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';

const logger = getLogger(path.basename(__filename));

interface Rectangle {
  height: number;
  width: number;
  x: number;
  y: number;
}

export enum ZOOM_DIRECTION {
  IN = 'IN',
  OUT = 'OUT',
  RESET = 'RESET',
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
    const urlProtocol = URL.parse(url).protocol || '';
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

export const zoomWindow = (direction: ZOOM_DIRECTION, browserWindow?: BrowserWindow): void => {
  let newZoomFactor = 1.0;

  switch (direction) {
    case ZOOM_DIRECTION.IN: {
      const currentZoomFactor = browserWindow?.webContents.getZoomFactor() || 1.0;
      newZoomFactor = Math.min(currentZoomFactor + 0.1, 2.0);
      break;
    }
    case ZOOM_DIRECTION.OUT: {
      const currentZoomFactor = browserWindow?.webContents.getZoomFactor() || 1.0;
      newZoomFactor = Math.max(currentZoomFactor - 0.1, 0.5);
      break;
    }
  }

  browserWindow?.webContents.setZoomFactor(newZoomFactor);
  settings.save(SettingsType.ZOOM_FACTOR, newZoomFactor);
};

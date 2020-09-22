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

const logger = getLogger(path.basename(__filename));

interface Rectangle {
  height: number;
  width: number;
  x: number;
  y: number;
}

export const pointInRectangle = (point: [number, number], rectangle: Rectangle): boolean => {
  const [x, y] = point;
  const xInRange = x >= rectangle.x && x <= rectangle.x + rectangle.width;
  const yInRange = y >= rectangle.y && y <= rectangle.y + rectangle.height;

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
      allowedProtocols.push('ftp:', 'http:', 'mailto:');
    }

    if (!allowedProtocols.includes(urlProtocol)) {
      logger.warn(`Prevented opening external URL "${url}".`);
      showWarningDialog(`Prevented opening external URL "${url}".`);
      return;
    }

    await shell.openExternal(url);
  } catch (error) {
    logger.error(error);
  }
};

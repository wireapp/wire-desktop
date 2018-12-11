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

import * as Electron from 'electron';
import * as url from 'url';

import {pointInRectangle} from '../lib/pointInRect';

const isInView = (win: Electron.BrowserWindow): boolean => {
  const windowBounds = win.getBounds();
  const nearestWorkArea = Electron.screen.getDisplayMatching(windowBounds).workArea;

  const upperLeftVisible = pointInRectangle([windowBounds.x, windowBounds.y], nearestWorkArea);
  const lowerRightVisible = pointInRectangle(
    [windowBounds.x + windowBounds.width, windowBounds.y + windowBounds.height],
    nearestWorkArea
  );

  return upperLeftVisible || lowerRightVisible;
};

const isMatchingHost = (_url: string, _baseUrl: string): boolean => url.parse(_url).host === url.parse(_baseUrl).host;

const isUUID = (string: string) =>
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/i.test(string);

export {isInView, isMatchingHost, isUUID};

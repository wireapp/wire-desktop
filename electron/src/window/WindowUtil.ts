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

import {BrowserWindow, screen} from 'electron';

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

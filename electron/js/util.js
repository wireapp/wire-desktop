/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

'use strict';

const electron = require('electron');

const config = require('./config');
const pointInRectangle = require('./lib/pointInRect');

module.exports = {
  isInView(win) {
    const windowBounds = win.getBounds();
    const nearestWorkArea = electron.screen.getDisplayMatching(windowBounds).workArea;

    const upperLeftVisible = pointInRectangle([windowBounds.x, windowBounds.y], nearestWorkArea);
    const lowerRightVisible = pointInRectangle(
      [windowBounds.x + windowBounds.width, windowBounds.y + windowBounds.height],
      nearestWorkArea,
    );

    return upperLeftVisible || lowerRightVisible;
  },

  openInExternalWindow(url) {
    for (const item of config.WHITE_LIST) {
      if (url.includes(item)) {
        return true;
      }
    }
    return false;
  },

  resizeToBig(win) {
    if (process.platform !== 'darwin') {
      win.setMenuBarVisibility(true);
    }
    win.setMinimumSize(config.MIN_WIDTH_MAIN, config.MIN_HEIGHT_MAIN);
    win.setSize(config.DEFAULT_WIDTH_MAIN, config.DEFAULT_HEIGHT_MAIN);
    win.setResizable(true);
    win.setMaximizable(true);
    win.center();
  },

  resizeToSmall(win) {
    if (process.platform !== 'darwin') {
      win.setMenuBarVisibility(false);
    }

    let height = config.HEIGHT_AUTH;
    if (process.platform === 'win32') {
      const WIN_OFFSET = 40;
      height += WIN_OFFSET;
    }
    win.setFullScreen(false);
    win.setMaximizable(false);
    win.setMinimumSize(config.WIDTH_AUTH, height);
    win.setSize(config.WIDTH_AUTH, height);
    win.setResizable(false);
    win.center();
  },
};

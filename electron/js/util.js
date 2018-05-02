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

const electron = require('electron');
const url = require('url');

const pointInRectangle = require('./lib/pointInRect');

module.exports = {
  capitalize: input => input.charAt(0).toUpperCase() + input.substr(1),

  isInView: win => {
    const windowBounds = win.getBounds();
    const nearestWorkArea = electron.screen.getDisplayMatching(windowBounds).workArea;

    const upperLeftVisible = pointInRectangle([windowBounds.x, windowBounds.y], nearestWorkArea);
    const lowerRightVisible = pointInRectangle([windowBounds.x + windowBounds.width, windowBounds.y + windowBounds.height], nearestWorkArea);

    return upperLeftVisible || lowerRightVisible;
  },

  isMatchingHost: (_url, _baseUrl) => url.parse(_url).host === url.parse(_baseUrl).host,
};

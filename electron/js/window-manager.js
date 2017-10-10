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

const {BrowserWindow} = require('electron');

let primaryWindowId;


function setPrimaryWindowId(newPrimaryWindowId) {
  primaryWindowId = newPrimaryWindowId;
};


function getPrimaryWindow() {
  if (primaryWindowId) {
    return BrowserWindow.fromId(primaryWindowId);
  }
  return BrowserWindow.getAllWindows()[0];
};


function showPrimaryWindow() {
  const win = getPrimaryWindow();
  if (win.isMinimized()) {
    win.restore();
  } else if (!win.isVisible()) {
    win.show();
  }
  win.focus();
};


module.exports = {
  getPrimaryWindow: getPrimaryWindow,
  setPrimaryWindowId: setPrimaryWindowId,
  showPrimaryWindow: showPrimaryWindow,
};

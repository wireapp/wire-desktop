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


const _getPrimaryWindow = () => primaryWindowId ? BrowserWindow.fromId(primaryWindowId) : BrowserWindow.getAllWindows()[0];

const _setPrimaryWindowId = (newPrimaryWindowId) => primaryWindowId = newPrimaryWindowId;

const _showPrimaryWindow = () => {
  const win = _getPrimaryWindow();

  if (win.isMinimized()) {
    win.restore();
  } else if (!win.isVisible()) {
    win.show();
  }

  win.focus();
};


module.exports = {
  setPrimaryWindowId: _setPrimaryWindowId,
  getPrimaryWindow: _getPrimaryWindow,
  showPrimaryWindow: _showPrimaryWindow,
};

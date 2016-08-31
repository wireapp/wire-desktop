/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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

const {app, BrowserWindow, Menu, Tray} = require('electron');

const path = require('path');
const config = require('./../config');

const iconExt = (process.platform === 'win32') ? 'ico' : 'png';

const iconPath = path.join(app.getAppPath(), 'img', ('tray.' + iconExt));
const iconBadgePath = path.join(app.getAppPath(), 'img', ('tray.badge.' + iconExt));

let appIcon = null;

module.exports = {
  createTrayIcon: function() {
    if (process.platform === 'darwin') {
      return;
    }

    appIcon = new Tray(iconPath);
    var contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open ' + config.NAME,
        click: function() {BrowserWindow.getAllWindows()[0].show();}
      }, {
        label: 'Quit',
        click: function() {app.quit();}
      }
    ]);

    appIcon.setToolTip(config.NAME);
    appIcon.setContextMenu(contextMenu);
    appIcon.on('click', function () {
      BrowserWindow.getAllWindows()[0].show();
    });
  },

  useDefaultIcon: function() {
    appIcon.setImage(iconPath);
  },

  useBadgeIcon: function() {
    appIcon.setImage(iconBadgePath);
  }
};

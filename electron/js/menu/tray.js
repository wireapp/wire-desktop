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



const {app, Menu, Tray} = require('electron');

const path = require('path');
const config = require('./../config');
const locale = require('./../../locale/locale');
const windowManager = require('./../window-manager');

const iconExt = (process.platform === 'win32') ? 'ico' : 'png';

const iconPath = path.join(app.getAppPath(), 'img', ('tray.' + iconExt));
const iconBadgePath = path.join(app.getAppPath(), 'img', ('tray.badge.' + iconExt));
const iconOverlayPath = path.join(app.getAppPath(), 'img', 'taskbar.overlay.png');

let lastUnreadCount = 0;

let appIcon = null;

module.exports = {
  createTrayIcon: function() {
    if (process.platform === 'darwin') {
      return;
    }

    appIcon = new Tray(iconPath);
    let contextMenu = Menu.buildFromTemplate([
      {
        label: locale.getText('trayOpen') + ' ' + config.NAME,
        click: function() {windowManager.showPrimaryWindow();},
      }, {
        label: locale.getText('trayQuit'),
        click: function() {app.quit();},
      },
    ]);

    appIcon.setToolTip(config.NAME);
    appIcon.setContextMenu(contextMenu);
    appIcon.on('click', function() {
      windowManager.showPrimaryWindow();
    });
  },

  updateBadgeIcon: function(win, count) {
    if (count) {
      this.useBadgeIcon();
    } else {
      this.useDefaultIcon();
    }
    win.setOverlayIcon(count && process.platform === 'win32' ? iconOverlayPath : null, locale.getText('unreadMessages'));
    win.flashFrame(!win.isFocused() && count > lastUnreadCount);
    app.setBadgeCount(count);
    lastUnreadCount = count;
  },

  useDefaultIcon: function() {
    if (appIcon == null) return;
    appIcon.setImage(iconPath);
  },

  useBadgeIcon: function() {
    if (appIcon == null) return;
    appIcon.setImage(iconBadgePath);
  },
};

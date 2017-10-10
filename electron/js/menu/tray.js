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
const environment = require('./../environment');
const locale = require('./../../locale/locale');
const windowManager = require('./../window-manager');

const iconExt = (environment.platform.IS_WINDOWS) ? 'ico' : 'png';

const iconPath = path.join(app.getAppPath(), 'img', ('tray.' + iconExt));
const iconBadgePath = path.join(app.getAppPath(), 'img', ('tray.badge.' + iconExt));
const iconOverlayPath = path.join(app.getAppPath(), 'img', 'taskbar.overlay.png');

let lastUnreadCount = 0;

let appIcon = null;

const _createTrayIcon = () => {
  if (!environment.platform.IS_MAC_OS) {
    appIcon = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: locale.getText('trayOpen'),
        click: () => windowManager.showPrimaryWindow(),
      }, {
        label: locale.getText('trayQuit'),
        click: () => app.quit(),
      },
    ]);

    appIcon.setToolTip(config.NAME);
    appIcon.setContextMenu(contextMenu);
    appIcon.on('click', () => windowManager.showPrimaryWindow());
  }
};

const _updateBadgeIcon = (win, count) => {
  if (count) {
    _useBadgeIcon();
  } else {
    _useDefaultIcon();
  }
  win.setOverlayIcon(count && environment.platform.IS_WINDOWS ? iconOverlayPath : null, locale.getText('unreadMessages'));
  win.flashFrame(!win.isFocused() && count > lastUnreadCount);
  app.setBadgeCount(count);
  lastUnreadCount = count;
};

const _useDefaultIcon = () => {
  if (appIcon) {
    appIcon.setImage(iconPath);
  }
};

const _useBadgeIcon = () => {
  if (appIcon) {
    appIcon.setImage(iconBadgePath);
  }
};

module.exports = {
  createTrayIcon: _createTrayIcon,
  updateBadgeIcon: _updateBadgeIcon,
};

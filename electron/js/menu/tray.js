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

const {app, Menu, nativeImage, Tray} = require('electron');

const fs = require('fs');
const path = require('path');
const config = require('./../config');
const environment = require('./../environment');
const lifecycle = require('./../lifecycle');
const locale = require('./../../locale/locale');
const windowManager = require('./../window-manager');

const iconExt = environment.platform.IS_WINDOWS ? 'ico' : 'png';

const iconPath = path.join(app.getAppPath(), 'img', `tray.${iconExt}`);
const iconBadgePath = path.join(app.getAppPath(), 'img', `tray.badge.${iconExt}`);
const iconOverlayPath = path.join(app.getAppPath(), 'img', 'taskbar.overlay.png');

let lastUnreadCount = 0;

let appIcon = null;

const setTrayIcon = imagePath => {
  if (fs.existsSync(imagePath)) {
    console.log(`Image path exists: ${imagePath}`);
    // TODO: Test with PNG only (@2X & Co.)
    const trayIcon = nativeImage.createFromPath(imagePath);
    if (appIcon) {
      appIcon.setImage(trayIcon);
    }
  } else {
    console.log(`Image path DOES NOT exist: ${imagePath}`);
  }
};

const createTrayIcon = () => {
  if (!environment.platform.IS_MAC_OS) {
    appIcon = new Tray(nativeImage.createEmpty());
    setTrayIcon(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        click: () => windowManager.showPrimaryWindow(),
        label: locale.getText('trayOpen'),
      },
      {
        click: async () => await lifecycle.quit(),
        label: locale.getText('trayQuit'),
      },
    ]);

    appIcon.setToolTip(config.NAME);
    appIcon.setContextMenu(contextMenu);
    appIcon.on('click', () => windowManager.showPrimaryWindow());
  }
};

const updateBadgeIcon = (win, count) => {
  if (count) {
    useBadgeIcon();
  } else {
    useDefaultIcon();
  }

  if (environment.platform.IS_WINDOWS) {
    // TODO: Check path before doing that!
    win.setOverlayIcon(count ? iconOverlayPath : null, locale.getText('unreadMessages'));
  }

  if (win.isFocused() || !count) {
    win.flashFrame(false);
  } else if (count > lastUnreadCount) {
    win.flashFrame(true);
  }
  app.setBadgeCount(count);
  lastUnreadCount = count;
};

const useDefaultIcon = () => {
  setTrayIcon(iconPath);
};

const useBadgeIcon = () => {
  setTrayIcon(iconBadgePath);
};

module.exports = {
  createTrayIcon,
  updateBadgeIcon,
};

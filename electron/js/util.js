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

const {app} = require('electron');

const config = require('./config');
const path = require('path');
const tray = require('./menu/tray');

const iconOverlayPath = path.join(app.getAppPath(), 'img', ('tray.badge.png'));

module.exports = {
  resizeToSmall: function(win) {
    if (process.platform !== 'darwin') {
      win.setMenuBarVisibility(false);
    }

    var height = config.HEIGHT_AUTH;
    if (process.platform === 'win32') {
      height += 40;
    }
    win.setFullScreen(false);
    win.setMaximizable(false);
    win.setMinimumSize(config.WIDTH_AUTH, height);
    win.setSize(config.WIDTH_AUTH, height);
    win.setResizable(false);
    win.center();
  },

  resizeToBig: function(win) {
    if (process.platform !== 'darwin') {
      win.setMenuBarVisibility(true);
    }
    win.setMinimumSize(config.MIN_WIDTH_MAIN, config.MIN_HEIGHT_MAIN);
    win.setSize(config.DEFAULT_WIDTH_MAIN, config.DEFAULT_HEIGHT_MAIN);
    win.setResizable(true);
    win.setMaximizable(true);
    win.center();
  },

  updateBadge: function(win, last_unread_count) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        var counter = (/\(([0-9]+)\)/).exec(win.getTitle() || (win.webContents ? win.webContents.getTitle() : ''));
        var count = counter ? counter[1] : 0;

        if (process.platform === 'win32') {
          if (count) {
            tray.useBadgeIcon();
            win.setOverlayIcon(iconOverlayPath, 'Unread messages');
            if (!win.isFocused() && count > last_unread_count) {
              win.flashFrame(true);
            }
          } else {
            win.flashFrame(false);
            win.setOverlayIcon(null, '');
            tray.useDefaultIcon();
          }
        } else {
          app.dock.setBadgeCount(count);
        }

        resolve(count);
      }, 50);
    });
  },

  openInExternalWindow: function(url) {
    for (let item of config.WHITE_LIST) {
      if (url.includes(item)) {
        return true;
      }
    }
    return false;
  },
};

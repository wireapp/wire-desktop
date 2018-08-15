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

'use strict';

const {BrowserWindow} = require('electron');
const assert = require('assert');
const path = require('path');
const TrayIconHandler = require('../../electron/js/menu/TrayIconHandler');

describe('TrayIconHandler', () => {
  const TrayMock = {
    on: () => {},
    setContextMenu: () => {},
    setImage: () => {},
    setToolTip: () => {},
  };

  describe('"constructor"', () => {
    it('creates native images for all tray icons on instantiation.', () => {
      const tray = new TrayIconHandler({IS_MAC_OS: false, IS_WINDOWS: true}, TrayMock);
      assert.equal(Object.keys(tray.icons).length, 3);
      assert.equal(tray.icons.badge.constructor.name, 'NativeImage');
      assert.equal(tray.icons.tray.constructor.name, 'NativeImage');
      assert.equal(tray.icons.trayWithBadge.constructor.name, 'NativeImage');
    });
  });

  describe('"updateBadgeIcon"', () => {
    it('updates the badge counter.', done => {
      const tray = new TrayIconHandler({IS_MAC_OS: true, IS_WINDOWS: false}, TrayMock);
      const window = new BrowserWindow();
      window.loadURL(`file://${path.join(__dirname, '..', 'fixtures', 'badge.html')}`);
      window.webContents.on('dom-ready', () => {
        tray.updateBadgeIcon(window, 10);
        assert.equal(tray.lastUnreadCount, 10);
        done();
      });
    });
  });
});

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

const assert = require('assert');
const path = require('path');
const chai = require('chai');
const TrayIconHandler = require('../../electron/js/menu/TrayIconHandler');
const {BrowserWindow} = require('electron');

chai.use(require('chai-spies'));
const sandbox = chai.spy.sandbox();

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
      const appWindow = new BrowserWindow();

      sandbox.on(appWindow, ['flashFrame']);

      appWindow.loadURL(`file://${path.join(__dirname, '..', 'fixtures', 'badge.html')}`);
      appWindow.webContents.on('dom-ready', () => {
        assert.equal(appWindow.isFocused(), true);
        assert.equal(appWindow.flashFrame.__spy.called, false);
        tray.updateBadgeIcon(appWindow, 10);
        assert.equal(appWindow.flashFrame.__spy.called, true);
        assert.equal(tray.lastUnreadCount, 10);
        done();
      });
    });

    it('does change the flash state if the window has already been flashed.', done => {
      const tray = new TrayIconHandler({IS_MAC_OS: true, IS_WINDOWS: false}, TrayMock);
      tray.lastUnreadCount = 5;

      const appWindow = new BrowserWindow({
        show: false,
        useContentSize: true,
      });

      sandbox.on(appWindow, ['flashFrame']);

      appWindow.loadURL(`file://${path.join(__dirname, '..', 'fixtures', 'badge.html')}`);
      appWindow.webContents.on('dom-ready', () => {
        assert.equal(appWindow.isFocused(), false);
        assert.equal(appWindow.flashFrame.__spy.called, false);
        tray.updateBadgeIcon(appWindow, 2);
        assert.equal(appWindow.flashFrame.__spy.called, false);
        done();
      });
      appWindow.showInactive();
    });
  });
});

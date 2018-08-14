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
const sinon = require('sinon');
const TrayIconHandler = require('../../electron/js/menu/TrayIconHandler');

describe('TrayIconHandler', () => {
  let tray = undefined;

  beforeEach(() => {
    const mockedTrayIcon = {
      setImage: () => {},
    };
    tray = new TrayIconHandler(mockedTrayIcon);
  });

  describe('"getDataURL"', () => {
    it('returns a data URL scheme.', () => {
      const imagePath = path.join(__dirname, '..', 'fixtures', 'tray.png');
      const url = TrayIconHandler.getDataURL(imagePath);
      assert.ok(url.startsWith('data:image/png;base64,'));
    });

    it('returns a default URL for invalid paths.', () => {
      const url = TrayIconHandler.getDataURL('./invalid/path.png');
      assert.equal(url, 'data:null');
    });
  });

  describe('"initIcons"', () => {
    it('creates native images from data URLs for all tray icons.', () => {
      assert.equal(Object.keys(tray.icons).length, 0);

      tray.initIcons();

      assert.equal(Object.keys(tray.icons).length, 3);
      assert.equal(tray.icons.badge.constructor.name, 'NativeImage');
      assert.equal(tray.icons.tray.constructor.name, 'NativeImage');
      assert.equal(tray.icons.trayWithBadge.constructor.name, 'NativeImage');
    });
  });

  describe('"updateBadgeIcon"', () => {
    it('updates the badge counter.', done => {
      sinon.stub(tray, 'hasOverlaySupport').get(() => false);
      sinon.stub(tray, 'hasTrayMenuSupport').get(() => false);

      tray.init();

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

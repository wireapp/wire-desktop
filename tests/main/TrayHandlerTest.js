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

const {app} = require('electron');
const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const TrayHandler = require('../../electron/js/menu/TrayHandler');
const {BrowserWindow} = require('electron');

describe('TrayIconHandler', () => {
  const TrayMock = {
    on: () => {},
    setContextMenu: () => {},
    setImage: () => {},
    setToolTip: () => {},
  };

  describe('initTray', () => {
    it('creates native images for all tray icons and sets a default tray icon', () => {
      const tray = new TrayHandler();
      tray.initTray(true, TrayMock);
      assert.equal(Object.keys(tray.icons).length, 3);
      assert.equal(tray.icons.badge.constructor.name, 'NativeImage');
      assert.equal(tray.icons.tray.constructor.name, 'NativeImage');
      assert.equal(tray.icons.trayWithBadge.constructor.name, 'NativeImage');
      sinon.assert.match(tray.trayIcon, sinon.match.defined);
    });
  });

  describe('updateBadgeIcon', () => {
    describe('without tray icon initialization', () => {
      it('updates the badge counter and stops flashing the app frame when app is in focus while receiving new messages', done => {
        const tray = new TrayHandler();
        const appWindow = new BrowserWindow();

        sinon.spy(app, 'setBadgeCount');
        sinon.spy(appWindow, 'flashFrame');

        appWindow.loadURL(`file://${path.join(__dirname, '..', 'fixtures', 'badge.html')}`);
        appWindow.webContents.on('dom-ready', () => {
          assert.equal(appWindow.isFocused(), true);
          assert.equal(appWindow.flashFrame.callCount, 0);
          tray.updateBadgeIcon(appWindow, 1);
          assert.ok(app.setBadgeCount.getCall(0).calledWith(1));
          assert.ok(appWindow.flashFrame.getCall(0).calledWith(false));
          assert.equal(tray.lastUnreadCount, 1);
          appWindow.flashFrame.restore();
          app.setBadgeCount.restore();
          done();
        });
      });
    });

    describe('with tray icon initialization', () => {
      it('updates the badge counter and stops flashing the app frame when app is in focus while receiving new messages', done => {
        const tray = new TrayHandler();
        tray.initTray(true, TrayMock);
        const appWindow = new BrowserWindow();

        sinon.spy(appWindow, 'flashFrame');

        appWindow.loadURL(`file://${path.join(__dirname, '..', 'fixtures', 'badge.html')}`);
        appWindow.webContents.on('dom-ready', () => {
          assert.equal(appWindow.isFocused(), true);
          assert.equal(appWindow.flashFrame.callCount, 0);
          tray.updateBadgeIcon(appWindow, 10);
          assert.ok(appWindow.flashFrame.getCall(0).calledWith(false));
          assert.equal(tray.lastUnreadCount, 10);
          appWindow.flashFrame.restore();
          done();
        });
      });

      it('flashes the app frame when app is not in focus and you receive new messages', done => {
        const tray = new TrayHandler();
        tray.initTray(true, TrayMock);

        const appWindow = new BrowserWindow({
          show: false,
          useContentSize: true,
        });

        sinon.spy(appWindow, 'flashFrame');

        appWindow.loadURL(`file://${path.join(__dirname, '..', 'fixtures', 'badge.html')}`);
        appWindow.webContents.on('dom-ready', () => {
          assert.equal(appWindow.isFocused(), false);
          tray.updateBadgeIcon(appWindow, 2);
          assert.ok(appWindow.flashFrame.getCall(0).calledWith(true));
          appWindow.flashFrame.restore();
          done();
        });
        appWindow.showInactive();
      });

      it('does change the flash state if the window has already been flashed', done => {
        const tray = new TrayHandler();
        tray.initTray(true, TrayMock);
        tray.lastUnreadCount = 5;

        const appWindow = new BrowserWindow({
          show: false,
          useContentSize: true,
        });

        sinon.spy(appWindow, 'flashFrame');

        appWindow.loadURL(`file://${path.join(__dirname, '..', 'fixtures', 'badge.html')}`);
        appWindow.webContents.on('dom-ready', () => {
          assert.equal(appWindow.isFocused(), false);
          tray.updateBadgeIcon(appWindow, 2);
          assert.equal(appWindow.flashFrame.callCount, 0);
          appWindow.flashFrame.restore();
          done();
        });
        appWindow.showInactive();
      });
    });
  });
});

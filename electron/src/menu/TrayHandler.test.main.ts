/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import * as assert from 'assert';
import {app, BrowserWindow, Tray} from 'electron';
import * as path from 'path';
import * as sinon from 'sinon';

import {TrayHandler} from './TrayHandler';

const fixturesDir = path.join(__dirname, '../../test/fixtures');
const TrayMock = new Tray(path.join(fixturesDir, 'tray.png'));

describe('initTray', () => {
  it('creates native images for all tray icons and sets a default tray icon', () => {
    const tray = new TrayHandler();
    tray.initTray(TrayMock);

    assert.strictEqual(Object.keys(tray['icons']!).length, 3);
    assert.strictEqual(tray['icons']!.badge.constructor.name, 'NativeImage');
    assert.strictEqual(tray['icons']!.tray.constructor.name, 'NativeImage');
    assert.strictEqual(tray['icons']!.trayWithBadge.constructor.name, 'NativeImage');
    sinon.assert.match(tray['trayIcon']!, sinon.match.defined);
  });
});

describe('showUnreadCount', () => {
  describe('without tray icon initialization', () => {
    it('updates the badge counter and stops flashing the app frame when app is in focus while receiving new messages', async () => {
      const tray = new TrayHandler();
      tray.initTray(TrayMock);

      const appWindow = new BrowserWindow();
      const badgeCountSpy = sinon.spy(app, 'setBadgeCount');
      const flashFrameSpy = sinon.spy(appWindow, 'flashFrame');

      await appWindow.loadURL('about:blank');
      assert.strictEqual(appWindow.isFocused(), true);
      assert.ok(flashFrameSpy.notCalled);
      tray.showUnreadCount(appWindow, 1);

      assert.ok(badgeCountSpy.firstCall.calledWith(1));
      assert.ok(flashFrameSpy.firstCall.calledWith(false));
      assert.strictEqual(tray['lastUnreadCount'], 1);

      flashFrameSpy.restore();
      badgeCountSpy.restore();
    });
  });

  describe('with tray icon initialization', () => {
    it('updates the badge counter and stops flashing the app frame when app is in focus while receiving new messages', async () => {
      const tray = new TrayHandler();
      tray.initTray(TrayMock);

      const appWindow = new BrowserWindow();
      const flashFrameSpy = sinon.spy(appWindow, 'flashFrame');

      await appWindow.loadFile(path.join(fixturesDir, 'badge.html'));
      assert.strictEqual(appWindow.isFocused(), true);
      assert.ok(flashFrameSpy.notCalled);
      tray.showUnreadCount(appWindow, 10);
      assert.ok(flashFrameSpy.firstCall.calledWith(false));
      assert.strictEqual(tray['lastUnreadCount'], 10);
      flashFrameSpy.restore();
    });

    it('flashes the app frame when app is not in focus and you receive new messages', async () => {
      const tray = new TrayHandler();
      tray.initTray(TrayMock);

      const appWindow = new BrowserWindow({
        show: false,
        useContentSize: true,
      });

      const flashFrameSpy = sinon.spy(appWindow, 'flashFrame');

      await appWindow.loadURL('about:blank');
      assert.strictEqual(appWindow.isFocused(), false);
      tray.showUnreadCount(appWindow, 2);
      assert.ok(flashFrameSpy.firstCall.calledWith(true));
      flashFrameSpy.restore();
    });

    it('does change the flash state if the window has already been flashed', async () => {
      const tray = new TrayHandler();
      tray.initTray(TrayMock);
      tray['lastUnreadCount'] = 5;

      const appWindow = new BrowserWindow({
        show: false,
        useContentSize: true,
      });

      const flashFrameSpy = sinon.spy(appWindow, 'flashFrame');

      await appWindow.loadURL('about:blank');
      assert.strictEqual(appWindow.isFocused(), false);
      tray.showUnreadCount(appWindow, 2);
      assert.ok(flashFrameSpy.notCalled);
      flashFrameSpy.restore();
    });
  });
});

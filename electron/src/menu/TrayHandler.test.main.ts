import sinon from 'sinon';
import * as assert from "assert";
import * as path from 'path';
import {TrayHandler} from "./TrayHandler";
import {BrowserWindow, app} from 'electron';

const TrayMock = {
  on: () => {},
  setContextMenu: () => {},
  setImage: () => {},
  setToolTip: () => {},
};

describe('initTray', () => {
  it('creates native images for all tray icons and sets a default tray icon', () => {
    const tray = new TrayHandler();
    tray.initTray(TrayMock);
    assert.strictEqual(Object.keys(tray.icons).length, 3);
    assert.strictEqual(tray.icons.badge.constructor.name, 'NativeImage');
    assert.strictEqual(tray.icons.tray.constructor.name, 'NativeImage');
    assert.strictEqual(tray.icons.trayWithBadge.constructor.name, 'NativeImage');
    sinon.assert.match(tray.trayIcon, sinon.match.defined);
  });
});

describe('showUnreadCount', () => {
  describe('without tray icon initialization', () => {
    it('updates the badge counter and stops flashing the app frame when app is in focus while receiving new messages', done => {
      const tray = new TrayHandler();
      const appWindow = new BrowserWindow();

      sinon.spy(app, 'setBadgeCount');
      sinon.spy(appWindow, 'flashFrame');

      appWindow.loadURL('about:blank');
      appWindow.webContents.on('dom-ready', () => {
        assert.strictEqual(appWindow.isFocused(), true);
        assert.strictEqual(appWindow.flashFrame.callCount, 0);
        tray.showUnreadCount(appWindow, 1);
        assert.ok(app.setBadgeCount.getCall(0).calledWith(1));
        assert.ok(appWindow.flashFrame.getCall(0).calledWith(false));
        assert.strictEqual(tray.lastUnreadCount, 1);
        appWindow.flashFrame.restore();
        app.setBadgeCount.restore();
        done();
      });
    });
  });

  describe('with tray icon initialization', () => {
    it('updates the badge counter and stops flashing the app frame when app is in focus while receiving new messages', done => {
      const tray = new TrayHandler();
      tray.initTray(TrayMock);
      const appWindow = new BrowserWindow();

      sinon.spy(appWindow, 'flashFrame');

      appWindow.loadURL(`file://${path.join(__dirname, '../fixtures/badge.html')}`);
      appWindow.webContents.on('dom-ready', () => {
        assert.strictEqual(appWindow.isFocused(), true);
        assert.strictEqual(appWindow.flashFrame.callCount, 0);
        tray.showUnreadCount(appWindow, 10);
        assert.ok(appWindow.flashFrame.getCall(0).calledWith(false));
        assert.strictEqual(tray.lastUnreadCount, 10);
        appWindow.flashFrame.restore();
        done();
      });
    });

    it('flashes the app frame when app is not in focus and you receive new messages', done => {
      const tray = new TrayHandler();
      tray.initTray(TrayMock);

      const appWindow = new BrowserWindow({
        show: false,
        useContentSize: true,
      });

      sinon.spy(appWindow, 'flashFrame');

      appWindow.loadURL('about:blank');
      appWindow.webContents.on('dom-ready', () => {
        assert.strictEqual(appWindow.isFocused(), false);
        tray.showUnreadCount(appWindow, 2);
        assert.ok(appWindow.flashFrame.getCall(0).calledWith(true));
        appWindow.flashFrame.restore();
        done();
      });
      appWindow.showInactive();
    });

    it('does change the flash state if the window has already been flashed', done => {
      const tray = new TrayHandler();
      tray.initTray(TrayMock);
      tray.lastUnreadCount = 5;

      const appWindow = new BrowserWindow({
        show: false,
        useContentSize: true,
      });

      sinon.spy(appWindow, 'flashFrame');

      appWindow.loadURL('about:blank');
      appWindow.webContents.on('dom-ready', () => {
        assert.strictEqual(appWindow.isFocused(), false);
        tray.showUnreadCount(appWindow, 2);
        assert.strictEqual(appWindow.flashFrame.callCount, 0);
        appWindow.flashFrame.restore();
        done();
      });
      appWindow.showInactive();
    });
  });
});

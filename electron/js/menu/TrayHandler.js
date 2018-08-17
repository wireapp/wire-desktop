const {app, Menu, nativeImage, Tray} = require('electron');
const config = require('./../config');
const lifecycle = require('./../lifecycle');
const locale = require('./../../locale/locale');
const path = require('path');
const windowManager = require('./../window-manager');

function buildTrayMenu() {
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

  this.trayIcon.on('click', () => windowManager.showPrimaryWindow());
  this.trayIcon.setContextMenu(contextMenu);
  this.trayIcon.setToolTip(config.NAME);
}

function flashApplicationWindow(win, count) {
  if (win.isFocused() || !count) {
    win.flashFrame(false);
  } else if (count > this.lastUnreadCount) {
    win.flashFrame(true);
  }
}

function updateBadgeCount(count) {
  app.setBadgeCount(count);
  this.lastUnreadCount = count;
}

function updateIcons(win, count) {
  if (this.icons) {
    const trayImage = count ? this.icons.trayWithBadge : this.icons.tray;
    this.trayIcon.setImage(trayImage);

    const overlayImage = count ? this.icons.badge : null;
    win.setOverlayIcon(overlayImage, locale.getText('unreadMessages'));
  }
}

class TrayHandler {
  constructor() {
    this.lastUnreadCount = 0;
  }

  initTray(trayIcon = new Tray(nativeImage.createEmpty())) {
    const IMAGE_ROOT = path.join(app.getAppPath(), 'img');

    const iconPaths = {
      badge: path.join(IMAGE_ROOT, 'taskbar.overlay.png'),
      tray: path.join(IMAGE_ROOT, 'tray-icon', 'tray', 'tray.png'),
      trayWithBadge: path.join(IMAGE_ROOT, 'tray-icon', 'tray-with-badge', 'tray.badge.png'),
    };

    this.icons = {
      badge: nativeImage.createFromPath(iconPaths.badge),
      tray: nativeImage.createFromPath(iconPaths.tray),
      trayWithBadge: nativeImage.createFromPath(iconPaths.trayWithBadge),
    };

    this.trayIcon = trayIcon;
    this.trayIcon.setImage(this.icons.tray);

    buildTrayMenu.call(this);
  }

  showUnreadCount(win, count) {
    updateIcons.call(this, win, count);
    flashApplicationWindow.call(this, win, count);
    updateBadgeCount.call(this, count);
  }
}

module.exports = TrayHandler;

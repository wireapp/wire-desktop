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

  this.appIcon.on('click', () => windowManager.showPrimaryWindow());
  this.appIcon.setContextMenu(contextMenu);
  this.appIcon.setToolTip(config.NAME);
}

class TrayHandler {
  constructor() {
    this.hasOverlaySupport = false;
    this.lastUnreadCount = 0;

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
  }

  initIcon(hasOverlaySupport, appIcon = new Tray(nativeImage.createEmpty())) {
    this.hasOverlaySupport = hasOverlaySupport;

    this.appIcon = appIcon;
    this.appIcon.setImage(this.icons.tray);

    buildTrayMenu.call(this);
  }

  updateBadgeIcon(win, count) {
    if (this.appIcon) {
      const trayImage = count ? this.icons.trayWithBadge : this.icons.tray;
      this.appIcon.setImage(trayImage);
    }

    if (this.hasOverlaySupport) {
      const overlayImage = count ? this.icons.badge : null;
      win.setOverlayIcon(overlayImage, locale.getText('unreadMessages'));
    }

    if (win.isFocused() || !count) {
      win.flashFrame(false);
    } else if (count > this.lastUnreadCount) {
      win.flashFrame(true);
    }

    app.setBadgeCount(count);
    this.lastUnreadCount = count;
  }
}

module.exports = TrayHandler;

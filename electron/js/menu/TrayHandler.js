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
  constructor(platform) {
    this.lastUnreadCount = 0;
    this.platform = platform;

    const TRAY_ICON_IMAGE_ROOT = path.join(app.getAppPath(), 'img');

    const iconPaths = {
      badge: path.join(TRAY_ICON_IMAGE_ROOT, 'taskbar.overlay.png'),
      tray: path.join(TRAY_ICON_IMAGE_ROOT, 'tray.png'),
      trayWithBadge: path.join(TRAY_ICON_IMAGE_ROOT, 'tray.badge.png'),
    };

    this.icons = {
      badge: nativeImage.createFromPath(iconPaths.badge),
      tray: nativeImage.createFromPath(iconPaths.tray),
      trayWithBadge: nativeImage.createFromPath(iconPaths.trayWithBadge),
    };
  }

  get hasOverlaySupport() {
    return this.platform.IS_WINDOWS;
  }

  initIcon(appIcon = new Tray(nativeImage.createEmpty())) {
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

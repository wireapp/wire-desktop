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

class TrayIconHandler {
  constructor(platform, appIcon = new Tray(nativeImage.createEmpty())) {
    this.appIcon = appIcon;
    this.lastUnreadCount = 0;
    this.platform = platform;

    this.icons = {
      badge: nativeImage.createFromPath(path.join(app.getAppPath(), 'img', 'taskbar.overlay.png')),
      tray: nativeImage.createFromPath(path.join(app.getAppPath(), 'img', `tray.${this.defaultImageExtension}`)),
      trayWithBadge: nativeImage.createFromPath(
        path.join(app.getAppPath(), 'img', `tray.badge.${this.defaultImageExtension}`)
      ),
    };

    this.initTrayIcon();
  }

  initTrayIcon() {
    this.appIcon.setImage(this.icons.tray);
    if (this.hasTrayMenuSupport) {
      buildTrayMenu.call(this);
    }
  }

  get defaultImageExtension() {
    return this.platform.IS_WINDOWS ? 'ico' : 'png';
  }

  get hasTrayMenuSupport() {
    return !this.platform.IS_MAC_OS;
  }

  get hasOverlaySupport() {
    return this.platform.IS_WINDOWS;
  }

  updateBadgeIcon(win, count) {
    const trayImage = count ? this.icons.trayWithBadge : this.icons.tray;
    this.appIcon.setImage(trayImage);

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

module.exports = TrayIconHandler;

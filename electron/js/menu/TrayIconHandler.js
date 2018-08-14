const {app, Menu, nativeImage, Tray} = require('electron');
const config = require('./../config');
const environment = require('./../environment');
const lifecycle = require('./../lifecycle');
const fs = require('fs');
const locale = require('./../../locale/locale');
const path = require('path');
const windowManager = require('./../window-manager');

class TrayIconHandler {
  constructor(appIcon = new Tray(nativeImage.createEmpty())) {
    this.appIcon = appIcon;
    this.icons = {};
    this.lastUnreadCount = 0;
  }

  init() {
    this.initIcons();
    this.appIcon.setImage(this.icons.tray);
    if (this.hasTrayMenuSupport) {
      this.buildTrayMenu();
    }
  }

  get defaultImageExtension() {
    return environment.platform.IS_WINDOWS ? 'ico' : 'png';
  }

  get hasTrayMenuSupport() {
    return !environment.platform.IS_MAC_OS;
  }

  get hasOverlaySupport() {
    return environment.platform.IS_WINDOWS;
  }

  buildTrayMenu() {
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

  getDataURL(imagePath) {
    if (fs.existsSync(imagePath)) {
      const image = nativeImage.createFromPath(imagePath);
      return image.toDataURL();
    }
    return 'data:null';
  }

  initIcons() {
    const badgeURL = this.getDataURL(path.join(app.getAppPath(), 'img', 'taskbar.overlay.png'));
    const trayURL = this.getDataURL(path.join(app.getAppPath(), 'img', `tray.${this.defaultImageExtension}`));
    const trayWithBadgeURL = this.getDataURL(
      path.join(app.getAppPath(), 'img', `tray.badge.${this.defaultImageExtension}`)
    );

    this.icons = {
      badge: nativeImage.createFromDataURL(badgeURL),
      tray: nativeImage.createFromDataURL(trayURL),
      trayWithBadge: nativeImage.createFromDataURL(trayWithBadgeURL),
    };
  }

  updateBadgeIcon(win, count) {
    if (count) {
      this.appIcon.setImage(this.icons.trayWithBadge);
    } else {
      this.appIcon.setImage(this.icons.tray);
    }

    if (this.hasOverlaySupport) {
      win.setOverlayIcon(count ? this.icons.badge : null, locale.getText('unreadMessages'));
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

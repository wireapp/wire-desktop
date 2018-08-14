const {app, Menu, nativeImage, Tray} = require('electron');
const config = require('./../config');
const environment = require('./../environment');
const lifecycle = require('./../lifecycle');
const fs = require('fs');
const locale = require('./../../locale/locale');
const path = require('path');
const windowManager = require('./../window-manager');

class TrayIconHandler {
  constructor() {
    this.icons = this.initIcons();

    this.appIcon = new Tray(this.icons.tray);
    this.lastUnreadCount = 0;

    if (!environment.platform.IS_MAC_OS) {
      this.buildTrayMenu();
    }
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
    const imageExtension = environment.platform.IS_WINDOWS ? 'ico' : 'png';

    const badgeURL = this.getDataURL(path.join(app.getAppPath(), 'img', 'taskbar.overlay.png'));
    const trayURL = this.getDataURL(path.join(app.getAppPath(), 'img', `tray.${imageExtension}`));
    const trayWithBadgeURL = this.getDataURL(path.join(app.getAppPath(), 'img', `tray.badge.${imageExtension}`));

    return {
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

    if (environment.platform.IS_WINDOWS) {
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

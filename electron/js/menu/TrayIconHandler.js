const {app, nativeImage, Tray} = require('electron');
const environment = require('./../environment');
const fs = require('fs');
const path = require('path');

class TrayIconHandler {
  constructor() {
    this.appIcon = new Tray(nativeImage.createEmpty());
    this.icons = this.initIcons();
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

  getDataURL(imagePath) {
    if (fs.existsSync(imagePath)) {
      const image = nativeImage.createFromPath(imagePath);
      return image.toDataURL();
    }
    return 'data:null';
  }

  updateBadgeIcon(win, count) {
    if (count) {
      this.appIcon.setImage(this.icons.trayWithBadge);
    } else {
      this.appIcon.setImage(this.icons.tray);
    }
  }
}

module.exports = TrayIconHandler;

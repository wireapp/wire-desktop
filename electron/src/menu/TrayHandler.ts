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

import {Menu, Tray, app, nativeImage} from 'electron';
import * as path from 'path';

import * as locale from '../locale/locale';
import {linuxDesktop, platform} from '../runtime/EnvironmentUtil';
import {quit as lifecycleQuit} from '../runtime/lifecycle';
import {config} from '../settings/config';
import {WindowManager} from '../window/WindowManager';

export class TrayHandler {
  icons?: {
    badge: nativeImage;
    tray: nativeImage;
    trayWithBadge: nativeImage;
  };
  lastUnreadCount: number;
  trayIcon?: Tray;

  constructor() {
    this.lastUnreadCount = 0;
  }

  initTray(trayIcon = new Tray(nativeImage.createEmpty())): void {
    const IMAGE_ROOT = path.join(app.getAppPath(), config.electronDirectory, 'img');

    let trayPng = 'tray.png';
    let trayBadgePng = 'tray.badge.png';

    if (platform.IS_LINUX) {
      trayPng = `tray${linuxDesktop.isGnomeX11 ? '.gnome' : '@3x'}.png`;
      trayBadgePng = `tray.badge${linuxDesktop.isGnomeX11 ? '.gnome' : '@3x'}.png`;
    }

    const iconPaths = {
      badge: path.join(IMAGE_ROOT, 'taskbar.overlay.png'),
      tray: path.join(IMAGE_ROOT, 'tray-icon/tray', trayPng),
      trayWithBadge: path.join(IMAGE_ROOT, 'tray-icon/tray-with-badge', trayBadgePng),
    };

    this.icons = {
      badge: nativeImage.createFromPath(iconPaths.badge),
      tray: nativeImage.createFromPath(iconPaths.tray),
      trayWithBadge: nativeImage.createFromPath(iconPaths.trayWithBadge),
    };

    this.trayIcon = trayIcon;
    this.trayIcon.setImage(this.icons.tray);

    this.buildTrayMenu();
  }

  showUnreadCount(win: Electron.BrowserWindow, count?: number): void {
    this.updateIcons(win, count);
    this.flashApplicationWindow(win, count);
    this.updateBadgeCount(count);
  }

  private buildTrayMenu(): void {
    const contextMenu = Menu.buildFromTemplate([
      {
        click: () => WindowManager.showPrimaryWindow(),
        label: locale.getText('trayOpen'),
      },
      {
        click: () => lifecycleQuit(),
        label: locale.getText('trayQuit'),
      },
    ]);

    if (this.trayIcon) {
      this.trayIcon.on('click', () => WindowManager.showPrimaryWindow());
      this.trayIcon.setContextMenu(contextMenu);
      this.trayIcon.setToolTip(config.name);
    }
  }

  private flashApplicationWindow(win: Electron.BrowserWindow, count?: number): void {
    if (win.isFocused() || !count) {
      win.flashFrame(false);
    } else if (count > this.lastUnreadCount) {
      win.flashFrame(true);
    }
  }

  private updateBadgeCount(count?: number): void {
    if (typeof count !== 'undefined') {
      app.setBadgeCount(count);
      this.lastUnreadCount = count;
    }
  }

  private updateIcons(win: Electron.BrowserWindow, count?: number): void {
    if (this.icons) {
      const trayImage = count ? this.icons.trayWithBadge : this.icons.tray;

      if (this.trayIcon) {
        this.trayIcon.setImage(trayImage);
      }

      const overlayImage = count ? this.icons.badge : null;
      win.setOverlayIcon(overlayImage, locale.getText('unreadMessages'));
    }
  }
}

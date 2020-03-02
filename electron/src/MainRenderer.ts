/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import * as path from 'path';
import * as minimist from 'minimist';
import WindowStateKeeper = require('electron-window-state');
import {app, BrowserWindow, BrowserWindowConstructorOptions, Menu, shell} from 'electron';
import fileUrl = require('file-url');
import * as fs from 'fs-extra';

import {settings} from './settings/ConfigurationPersistence';
import {SettingsType} from './settings/SettingsType';
import {config} from './settings/config';
import * as EnvironmentUtil from './runtime/EnvironmentUtil';
import {WindowManager} from './window/WindowManager';
import {ENABLE_LOGGING, getLogger} from './logging/getLogger';
import {attachTo as attachCertificateVerifyProcManagerTo} from './lib/CertificateVerifyProcManager';
import * as locale from './locale/locale';
import {WindowUtil} from './window/WindowUtil';
import {CustomProtocolHandler} from './lib/CoreProtocol';
import {EVENT_TYPE} from './lib/eventType';
import {menuItem as developerMenu} from './menu/developer';
import * as systemMenu from './menu/system';
import {TrayHandler} from './menu/TrayHandler';
import {applyProxySettings} from './applyProxySettings';

const argv = minimist(process.argv.slice(1));
const APP_PATH = path.join(app.getAppPath(), config.electronDirectory);
const BASE_URL = EnvironmentUtil.web.getWebappUrl(argv.env);
const PRELOAD_JS = path.join(APP_PATH, 'dist/renderer/preload-app.js');
const INDEX_HTML = path.join(APP_PATH, 'renderer/index.html');
const WRAPPER_CSS = path.join(APP_PATH, 'css/wrapper.css');
const WINDOW_SIZE = {
  DEFAULT_HEIGHT: 768,
  DEFAULT_WIDTH: 1024,
  MIN_HEIGHT: 512,
  MIN_WIDTH: 760,
};
const iconFileName = `logo.${EnvironmentUtil.platform.IS_WINDOWS ? 'ico' : 'png'}`;
const iconPath = path.join(APP_PATH, 'img', iconFileName);

const logger = getLogger(path.basename(__filename));

export class MainRenderer {
  private readonly mainRenderer: BrowserWindow;
  private isFullScreen: boolean = false;
  private readonly customProtocolHandler = new CustomProtocolHandler();
  private readonly mainWindowState: WindowStateKeeper.State;

  // Workaround variables
  private readonly isQuitting: () => boolean;
  private readonly tray: TrayHandler;

  constructor(tray: TrayHandler, isQuitting: () => boolean) {
    this.isQuitting = isQuitting;
    this.mainWindowState = this.initWindowStateKeeper();
    this.tray = tray;

    const showMenuBar = settings.restore(SettingsType.SHOW_MENU_BAR, true);

    const options: BrowserWindowConstructorOptions = {
      autoHideMenuBar: !showMenuBar,
      backgroundColor: '#f7f8fa',
      height: this.mainWindowState.height,
      icon: iconPath,
      minHeight: WINDOW_SIZE.MIN_HEIGHT,
      minWidth: WINDOW_SIZE.MIN_WIDTH,
      show: false,
      title: config.name,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        backgroundThrottling: false,
        enableBlinkFeatures: '',
        nodeIntegration: false,
        preload: PRELOAD_JS,
        webviewTag: true,
      },
      width: this.mainWindowState.width,
      // eslint-disable-next-line
      x: this.mainWindowState.x,
      // eslint-disable-next-line
      y: this.mainWindowState.y,
    };

    this.initSystemMenu();
    this.mainRenderer = new BrowserWindow(options);
  }

  public create = async () => {
    this.mainWindowState.manage(this.mainRenderer);
    attachCertificateVerifyProcManagerTo(this.mainRenderer);
    this.checkConfigV0FullScreen(this.mainWindowState);

    let webappUrl = `${BASE_URL}${BASE_URL.includes('?') ? '&' : '?'}hl=${locale.getCurrent()}`;

    if (ENABLE_LOGGING) {
      webappUrl += `&enableLogging=@wireapp/*`;
    }

    if (this.customProtocolHandler.hashLocation) {
      webappUrl += `#${this.customProtocolHandler.hashLocation}`;
    }

    if (argv.devtools) {
      this.mainRenderer.webContents.openDevTools({mode: 'detach'});
    }

    if (!argv.startup && !argv.hidden) {
      if (!WindowUtil.isInView(this.mainRenderer)) {
        this.mainRenderer.center();
      }

      WindowManager.setPrimaryWindowId(this.mainRenderer.id);
      setTimeout(() => this.show(), 800);
    }

    this.mainRenderer.webContents.on('will-navigate', event => {
      // Prevent any kind of navigation inside the this.mainRenderer window
      event.preventDefault();
    });

    // Handle the new window event in the this.mainRenderer Browser Window
    this.mainRenderer.webContents.on('new-window', async (event, url) => {
      event.preventDefault();

      // Ensure the link does not come from a webview
      if (typeof (event as any).sender.viewInstanceId !== 'undefined') {
        logger.log('New window was created from a webview, aborting.');
        return;
      }

      await shell.openExternal(url);
    });

    this.mainRenderer.on('focus', () => {
      systemMenu.registerGlobalShortcuts();
      this.flashFrame(false);
    });

    this.mainRenderer.on('blur', () => systemMenu.unregisterGlobalShortcuts());

    this.mainRenderer.on('page-title-updated', () => {
      this.tray.showUnreadCount(this);
    });

    this.mainRenderer.on('close', event => {
      if (!this.isQuitting()) {
        event.preventDefault();
        logger.log('Closing window...');

        if (this.mainRenderer.isFullScreen()) {
          logger.log('Fullscreen detected, leaving full screen before hiding...');
          this.mainRenderer.once('leave-full-screen', () => this.hide());
          this.mainRenderer.setFullScreen(false);
        } else {
          this.hide();
        }
        systemMenu.unregisterGlobalShortcuts();
      }
    });

    this.mainRenderer.webContents.on('crashed', event => {
      logger.error('WebContents crashed. Will reload the window.');
      logger.error(event);
      this.reload();
    });

    app.on('gpu-process-crashed', event => {
      logger.error('GPU process crashed. Will reload the window.');
      logger.error(event);
      this.reload();
    });

    await this.mainRenderer.loadURL(`${fileUrl(INDEX_HTML)}?env=${encodeURIComponent(webappUrl)}`);
    const wrapperCSSContent = await fs.readFile(WRAPPER_CSS, 'utf8');
    this.mainRenderer.webContents.insertCSS(wrapperCSSContent);

    if (argv.startup || argv.hidden) {
      this.mainRenderer.webContents.send(EVENT_TYPE.PREFERENCES.SET_HIDDEN);
    }
    this.customProtocolHandler.registerCoreProtocol();
  };

  public applyProxySettings = (authenticatedProxyDetails: URL) =>
    applyProxySettings(authenticatedProxyDetails, this.mainRenderer.webContents);

  sendDataDeletedEvent = () => this.mainRenderer.webContents.send(EVENT_TYPE.ACCOUNT.DATA_DELETED);
  setOverlayIcon = (image: Electron.NativeImage | null, text: string) => this.mainRenderer.setOverlayIcon(image, text);
  isFocused = () => this.mainRenderer.isFocused();
  flashFrame = (flag: boolean) => this.mainRenderer.flashFrame(flag);
  reload = () => this.mainRenderer.reload();
  hide = () => this.mainRenderer.hide();
  show = () => this.mainRenderer.show();

  private readonly initWindowStateKeeper = () => {
    const loadedWindowBounds = settings.restore(SettingsType.WINDOW_BOUNDS, {
      height: WINDOW_SIZE.DEFAULT_HEIGHT,
      width: WINDOW_SIZE.DEFAULT_WIDTH,
    });

    // load version 0 full screen setting
    const showInFullScreen = settings.restore(SettingsType.FULL_SCREEN, 'not-set-in-v0');

    const stateKeeperOptions: {
      defaultHeight: number;
      defaultWidth: number;
      path: string;
      fullScreen?: boolean;
      maximize?: boolean;
    } = {
      defaultHeight: loadedWindowBounds.height,
      defaultWidth: loadedWindowBounds.width,
      path: path.join(app.getPath('userData'), 'config'),
    };

    if (showInFullScreen !== 'not-set-in-v0') {
      stateKeeperOptions.fullScreen = showInFullScreen;
      stateKeeperOptions.maximize = showInFullScreen;
      this.isFullScreen = showInFullScreen;
    }

    return WindowStateKeeper(stateKeeperOptions);
  };

  private readonly checkConfigV0FullScreen = (mainWindowState: WindowStateKeeper.State) => {
    // if a user still has the old config version 0 and had the window maximized last time
    if (typeof mainWindowState.isMaximized === 'undefined' && this.isFullScreen === true) {
      this.mainRenderer.maximize();
    }
  };

  private readonly initSystemMenu = () => {
    const appMenu = systemMenu.createMenu(this.isFullScreen);
    if (EnvironmentUtil.app.IS_DEVELOPMENT) {
      appMenu.append(developerMenu);
    }
    Menu.setApplicationMenu(appMenu);
  };
}

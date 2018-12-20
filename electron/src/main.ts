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

// Modules
import {BrowserWindow, Event, IpcMessageEvent, Menu, app, ipcMain, shell} from 'electron';
import WindowStateKeeper = require('electron-window-state');
import fileUrl = require('file-url');
import * as fs from 'fs-extra';
import * as logdown from 'logdown';
import * as minimist from 'minimist';
import * as path from 'path';
import {OnHeadersReceivedCallback, OnHeadersReceivedDetails} from './interfaces/';
// Wrapper modules
import * as about from './js/about';
import * as appInit from './js/appInit';
import * as config from './js/config';
import * as environment from './js/environment';
import * as initRaygun from './js/initRaygun';
import * as lifecycle from './js/lifecycle';
import * as util from './js/util';
import * as windowManager from './js/window-manager';
import {
  attachTo as attachCertificateVerifyProcManagerTo,
  setCertificateVerifyProc,
} from './lib/CertificateVerifyProcManager';
import {download} from './lib/download';
import {EVENT_TYPE} from './lib/eventType';
import {deleteAccount} from './lib/LocalAccountDeletion';
import {SingleSignOn} from './lib/SingleSignOn';
import {WebViewFocus} from './lib/webViewFocus';
import * as locale from './locale/locale';
import {menuItem as developerMenu} from './menu/developer';
import * as systemMenu from './menu/system';
import {TrayHandler} from './menu/TrayHandler';
// Configuration persistence
import {settings} from './settings/ConfigurationPersistence';
import {SettingsType} from './settings/SettingsType';
import {LogFactory} from './util/';

// Paths
const APP_PATH = app.getAppPath();
const INDEX_HTML = path.join(APP_PATH, 'renderer', 'index.html');
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const PRELOAD_JS = path.join(APP_PATH, 'dist', 'js', 'preload.js');
const PRELOAD_RENDERER_JS = path.join(APP_PATH, 'renderer', 'static', 'webview-preload.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css', 'wrapper.css');

LogFactory.LOG_FILE_PATH = LOG_DIR;
LogFactory.LOG_FILE_NAME = 'electron.log';

const logger = LogFactory.getLogger('main.ts', {forceEnable: true});

// Config
const argv = minimist(process.argv.slice(1));
const BASE_URL = environment.web.getWebappUrl(argv.env);

// Icon
const ICON = `wire.${environment.platform.IS_WINDOWS ? 'ico' : 'png'}`;
const ICON_PATH = path.join(APP_PATH, 'img', ICON);
let tray: TrayHandler;

let isFullScreen = false;
let isQuitting = false;
let main: BrowserWindow;

// IPC events
const bindIpcEvents = () => {
  ipcMain.on(EVENT_TYPE.ACTION.SAVE_PICTURE, async (event: IpcMessageEvent, fileName: string, bytes: Uint8Array) => {
    await download(fileName, bytes);
  });

  ipcMain.on(EVENT_TYPE.ACTION.NOTIFICATION_CLICK, () => {
    windowManager.showPrimaryWindow();
  });

  ipcMain.on(EVENT_TYPE.UI.BADGE_COUNT, (event: IpcMessageEvent, count: number) => {
    tray.showUnreadCount(main, count);
  });

  ipcMain.on(EVENT_TYPE.ACCOUNT.DELETE_DATA, deleteAccount);
  ipcMain.on(EVENT_TYPE.WRAPPER.RELAUNCH, lifecycle.relaunch);
  ipcMain.on(EVENT_TYPE.ABOUT.SHOW, about.showWindow);
};

const checkConfigV0FullScreen = (mainWindowState: WindowStateKeeper.State) => {
  // if a user still has the old config version 0 and had the window maximized last time
  if (typeof mainWindowState.isMaximized === 'undefined' && isFullScreen === true) {
    main.maximize();
  }
};

const initWindowStateKeeper = () => {
  const loadedWindowBounds = settings.restore(SettingsType.WINDOW_BOUNDS, {
    height: config.WINDOW.MAIN.DEFAULT_HEIGHT,
    width: config.WINDOW.MAIN.DEFAULT_WIDTH,
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
    isFullScreen = showInFullScreen;
  }

  return WindowStateKeeper(stateKeeperOptions);
};

// App Windows
const showMainWindow = (mainWindowState: WindowStateKeeper.State) => {
  const showMenuBar = settings.restore(SettingsType.SHOW_MENU_BAR, true);

  const options: Electron.BrowserWindowConstructorOptions = {
    autoHideMenuBar: !showMenuBar,
    backgroundColor: '#f7f8fa',
    height: mainWindowState.height,
    icon: ICON_PATH,
    minHeight: config.WINDOW.MAIN.MIN_HEIGHT,
    minWidth: config.WINDOW.MAIN.MIN_WIDTH,
    show: false,
    title: config.NAME,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      preload: PRELOAD_JS,
      webviewTag: true,
    },
    width: mainWindowState.width,
    x: mainWindowState.x,
    y: mainWindowState.y,
  };

  main = new BrowserWindow(options);

  mainWindowState.manage(main);
  attachCertificateVerifyProcManagerTo(main);
  checkConfigV0FullScreen(mainWindowState);

  const baseURL = `${BASE_URL}${BASE_URL.includes('?') ? '&' : '?'}hl=${locale.getCurrent()}`;
  main.loadURL(`${fileUrl(INDEX_HTML)}?env=${encodeURIComponent(baseURL)}`);

  if (argv.devtools) {
    main.webContents.openDevTools({mode: 'detach'});
  }

  if (!argv.startup && !argv.hidden) {
    if (!util.isInView(main)) {
      main.center();
    }

    windowManager.setPrimaryWindowId(main.id);
    setTimeout(() => main.show(), 800);
  }

  main.on('focus', () => systemMenu.registerShortcuts());
  main.on('blur', () => systemMenu.unregisterShortcuts());

  main.webContents.on('will-navigate', (event, url) => {
    // Prevent any kind of navigation inside the main window
    event.preventDefault();
  });

  // Handle the new window event in the main Browser Window
  main.webContents.on('new-window', (event, _url) => {
    event.preventDefault();

    // Ensure the link does not come from a webview
    if (typeof (event.sender as any).viewInstanceId !== 'undefined') {
      logger.log('New window was created from a webview, aborting.');
      return;
    }

    shell.openExternal(_url);
  });

  main.webContents.on('dom-ready', () => {
    main.webContents.insertCSS(fs.readFileSync(WRAPPER_CSS, 'utf8'));
  });

  main.on('focus', () => main.flashFrame(false));
  main.on('page-title-updated', () => tray.showUnreadCount(main));

  main.on('close', event => {
    if (!isQuitting) {
      event.preventDefault();
      logger.log('Closing window...');

      if (main.isFullScreen()) {
        logger.log('Fullscreen detected, leaving full screen before hiding...');
        main.once('leave-full-screen', () => main.hide());
        main.setFullScreen(false);
      } else {
        main.hide();
      }
    }
  });

  main.webContents.on('crashed', () => main.reload());
};

// App Events
const handleAppEvents = () => {
  app.on('window-all-closed', async () => {
    if (!environment.platform.IS_MAC_OS) {
      await lifecycle.quit();
    }
  });

  app.on('activate', () => {
    if (main) {
      main.show();
    }
  });

  app.on('before-quit', () => {
    settings.persistToFile();
    isQuitting = true;
  });

  // System Menu & Tray Icon & Show window
  app.on('ready', () => {
    const mainWindowState = initWindowStateKeeper();
    const appMenu = systemMenu.createMenu(isFullScreen);
    if (environment.app.IS_DEVELOPMENT) {
      appMenu.append(developerMenu);
    }

    Menu.setApplicationMenu(appMenu);
    tray = new TrayHandler();
    if (!environment.platform.IS_MAC_OS) {
      tray.initTray();
    }
    showMainWindow(mainWindowState);
  });
};

const renameFileExtensions = (files: string[], oldExtension: string, newExtension: string): void => {
  files
    .filter(file => {
      try {
        return fs.statSync(file).isFile();
      } catch (statError) {
        return false;
      }
    })
    .forEach(file => {
      if (file.endsWith(oldExtension)) {
        try {
          fs.renameSync(file, file.replace(oldExtension, newExtension));
        } catch (error) {
          logger.error(`Failed to rename log file: "${error.message}"`);
        }
      }
    });
};

const renameWebViewLogFiles = (): void => {
  // Rename "console.log" to "console.old" (for every log directory of every account)
  fs.readdir(LOG_DIR, (readError, contents) => {
    if (readError) {
      return logger.log(`Failed to read log directory with error: ${readError.message}`);
    }

    const logFiles = contents.map(file => path.join(LOG_DIR, file, config.LOG_FILE_NAME));
    renameFileExtensions(logFiles, '.log', '.old');
  });
};

const initElectronLogFile = (): void => {
  renameFileExtensions([LogFactory.getFileURI()], '.log', '.old');
  fs.ensureFileSync(LogFactory.getFileURI());
};

class ElectronWrapperInit {
  logger: logdown.Logger;

  constructor() {
    this.logger = LogFactory.getLogger('ElectronWrapperInit');
  }

  async run() {
    this.logger.log('webviewProtection init');
    this.webviewProtection();
  }

  // <webview> hardening
  webviewProtection() {
    const openLinkInNewWindow = (
      event: Electron.Event,
      url: string,
      frameName: string,
      disposition: string,
      options: Electron.Options
    ) => {
      event.preventDefault();

      if (SingleSignOn.isSingleSignOnLoginWindow(frameName) && SingleSignOn.isBackendOrigin(url)) {
        return new SingleSignOn(main, event, url, options).init();
      }

      this.logger.log(`Opening an external window from a webview. URL: ${url}`);
      return shell.openExternal(url);
    };

    const willNavigateInWebview = (event: Event, _url: string) => {
      // Ensure navigation is to a whitelisted domain
      if (util.isMatchingHost(_url, BASE_URL)) {
        this.logger.log(`Navigating inside webview. URL: ${_url}`);
      } else {
        this.logger.log(`Preventing navigation inside WebView. URL: ${_url}`);
        event.preventDefault();
      }
    };

    app.on('web-contents-created', (webviewEvent, contents) => {
      WebViewFocus.bindTracker(webviewEvent, contents);

      switch ((contents as any).getType()) {
        case 'window':
          contents.on('will-attach-webview', (event, webPreferences, params) => {
            const _url = params.src;

            // Verify the URL is being loaded
            if (!util.isMatchingHost(_url, BASE_URL)) {
              event.preventDefault();
              this.logger.log(`Prevented to show an unauthorized <webview>. URL: ${_url}`);
              return;
            }

            // Use secure defaults
            params.autosize = false;
            params.contextIsolation = true;
            params.plugins = false;
            webPreferences.allowRunningInsecureContent = false;
            webPreferences.nodeIntegration = false;
            webPreferences.preloadURL = fileUrl(PRELOAD_RENDERER_JS);
            webPreferences.webSecurity = true;
          });
          break;

        case 'webview':
          // Open webview links outside of the app
          contents.on('new-window', openLinkInNewWindow);
          contents.on('will-navigate', willNavigateInWebview);

          contents.session.setCertificateVerifyProc(setCertificateVerifyProc);

          // Override remote Access-Control-Allow-Origin for localhost (CORS bypass)
          const isLocalhostEnvironment = environment.getEnvironment() == environment.BackendType.LOCALHOST;
          if (isLocalhostEnvironment) {
            contents.session.webRequest.onHeadersReceived(
              {
                urls: config.BACKEND_ORIGINS.map(value => `${value}/*`),
              },
              (details: OnHeadersReceivedDetails, callback: OnHeadersReceivedCallback) => {
                details.responseHeaders['Access-Control-Allow-Origin'] = ['http://localhost:8081'];
                details.responseHeaders['Access-Control-Allow-Credentials'] = ['true'];

                callback({
                  cancel: false,
                  responseHeaders: details.responseHeaders,
                });
              }
            );
          }

          break;
      }
    });
  }
}

initRaygun.initClient();
appInit.ignoreCertificateErrorsInDevelopment();
appInit.handlePortableFlags();
lifecycle.checkSingleInstance();
lifecycle.checkForUpdate();

// Stop further execution on update to prevent second tray icon
if (lifecycle.isFirstInstance) {
  appInit.addLinuxWorkarounds();
  bindIpcEvents();
  handleAppEvents();
  renameWebViewLogFiles();
  initElectronLogFile();
  new ElectronWrapperInit().run().catch(error => logger.error(error));
}

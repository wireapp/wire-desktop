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
import * as certificateUtils from '@wireapp/certificate-check';
import {BrowserWindow, Event, IpcMessageEvent, Menu, app, ipcMain, shell} from 'electron';
import WindowStateKeeper = require('electron-window-state');
import fileUrl = require('file-url');
import * as fs from 'fs-extra';
import * as logdown from 'logdown';
import * as minimist from 'minimist';
import * as path from 'path';
import {URL} from 'url';
import {OnHeadersReceivedCallback, OnHeadersReceivedDetails} from './interfaces/';
import {SingleSignOn} from './lib/SingleSignOn';
import {LogFactory} from './util/';

const logger = LogFactory.getLogger('main.ts');

// Paths
const APP_PATH = app.getAppPath();

// Local files
const INDEX_HTML = path.join(APP_PATH, 'renderer', 'index.html');
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const PRELOAD_JS = path.join(APP_PATH, 'dist', 'js', 'preload.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css', 'wrapper.css');

// Configuration persistence
import {settings} from './settings/ConfigurationPersistence';
import {SettingsType} from './settings/SettingsType';

// Wrapper modules
import * as about from './js/about';
import * as appInit from './js/appInit';
import * as config from './js/config';
import * as environment from './js/environment';
import * as initRaygun from './js/initRaygun';
import * as lifecycle from './js/lifecycle';
import * as util from './js/util';
import * as windowManager from './js/window-manager';
import {download} from './lib/download';
import {EVENT_TYPE} from './lib/eventType';
import * as locale from './locale/locale';
import {menuItem as developerMenu} from './menu/developer';
import * as systemMenu from './menu/system';
import {TrayHandler} from './menu/TrayHandler';

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

  ipcMain.on(EVENT_TYPE.ACCOUNT.DELETE_DATA, (event: IpcMessageEvent, accountID: string, sessionID?: string) => {
    // delete webview partition
    try {
      if (sessionID) {
        const partitionDir = path.join(app.getPath('userData'), 'Partitions', sessionID);
        fs.removeSync(partitionDir);
        logger.log(`Deleted partition for account: ${sessionID}`);
      } else {
        logger.log(`Skipping partition deletion for account: ${accountID}`);
      }
    } catch (error) {
      logger.log(`Failed to partition for account: ${sessionID}`);
    }

    // delete logs
    try {
      fs.removeSync(LOG_DIR);
      logger.log(`Deleted logs folder for account: ${accountID}`);
    } catch (error) {
      logger.log(`Failed to delete logs folder for account: ${accountID} with error: ${error.message}`);
    }
  });

  ipcMain.on(EVENT_TYPE.WRAPPER.RELAUNCH, lifecycle.relaunch);
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

  main.webContents.session.webRequest.onHeadersReceived(
    {
      urls: ['https://staging-nginz-https.zinfra.io/*'],
    },
    (details: OnHeadersReceivedDetails, callback: OnHeadersReceivedCallback) => {
      if (environment.getEnvironment() === environment.TYPE.LOCALHOST) {
        // Override remote Access-Control-Allow-Origin
        details.responseHeaders['Access-Control-Allow-Origin'] = ['http://localhost:8080'];
        details.responseHeaders['Access-Control-Allow-Credentials'] = ['true'];
      }

      callback({
        cancel: false,
        responseHeaders: details.responseHeaders,
      });
    }
  );

  main.webContents.on('dom-ready', () => {
    main.webContents.insertCSS(fs.readFileSync(WRAPPER_CSS, 'utf8'));
  });

  main.on('focus', () => main.flashFrame(false));
  main.on('page-title-updated', () => tray.showUnreadCount(main));

  main.on('close', event => {
    if (!isQuitting) {
      event.preventDefault();
      logger.log('Closing window...');

      if (isFullScreen) {
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
    (appMenu as any).on(EVENT_TYPE.ABOUT.SHOW, () => about.showWindow());

    Menu.setApplicationMenu(appMenu);
    tray = new TrayHandler();
    if (!environment.platform.IS_MAC_OS) {
      tray.initTray();
    }
    showMainWindow(mainWindowState);
  });
};

const renameLogFile = () => {
  // Rename "console.log" to "console.old" (for every log directory of every account)
  fs.readdir(LOG_DIR, (readError, contents) => {
    if (readError) {
      return console.log(`Failed to read log directory with error: ${readError.message}`);
    }

    contents
      .map(file => path.join(LOG_DIR, file, config.LOG_FILE_NAME))
      .filter(file => {
        try {
          return fs.statSync(file).isFile();
        } catch (statError) {
          return undefined;
        }
      })
      .forEach(file => {
        if (file.endsWith('.log')) {
          try {
            fs.renameSync(file, file.replace('.log', '.old'));
          } catch (error) {
            console.error(`Failed to rename log file: ${error.message}`);
          }
        }
      });
  });
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
        this.logger.log(`Preventing navigation inside webview. URL: ${_url}`);
        event.preventDefault();
      }
    };

    app.on('web-contents-created', (webviewEvent, contents) => {
      switch ((contents as any).getType()) {
        case 'window':
          contents.on('will-attach-webview', (event, webPreferences, params) => {
            const _url = params.src;

            // Use secure defaults
            webPreferences.nodeIntegration = false;
            webPreferences.webSecurity = true;
            params.contextIsolation = true;
            webPreferences.allowRunningInsecureContent = false;
            params.plugins = false;
            params.autosize = false;

            // Verify the URL being loaded
            if (!util.isMatchingHost(_url, BASE_URL)) {
              event.preventDefault();
              this.logger.log(`Prevented to show an unauthorized <webview>. URL: ${_url}`);
            }
          });
          break;

        case 'webview':
          // Open webview links outside of the app
          contents.on('new-window', openLinkInNewWindow);
          contents.on('will-navigate', willNavigateInWebview);

          contents.session.setCertificateVerifyProc(
            (request: Electron.CertificateVerifyProcRequest, cb: (verificationResult: number) => void) => {
              const {hostname, certificate, verificationResult} = request;
              const {hostname: hostnameInternal} = new URL(environment.URL_WEBAPP.INTERNAL);

              // Disable TLS verification for development backend
              if (hostname === hostnameInternal && environment.app.IS_DEVELOPMENT) {
                return cb(-3);
              }

              // Check browser results
              if (verificationResult !== 'net::OK') {
                console.error('setCertificateVerifyProc failed', hostname, verificationResult);
                return cb(-2);
              }

              // Check certificate pinning
              if (certificateUtils.hostnameShouldBePinned(hostname)) {
                const pinningResults = certificateUtils.verifyPinning(hostname, certificate);

                for (const result of Object.values(pinningResults)) {
                  if (result === false) {
                    console.error(`Certificate verification failed for "${hostname}":\n${pinningResults.errorMessage}`);
                    return cb(-2);
                  }
                }
              }

              return cb(-3);
            }
          );
          break;
      }
    });
  }
}

initRaygun.initClient();
appInit.ignoreCertificateErrors();
appInit.handlePortableFlags();
lifecycle.checkSingleInstance();
lifecycle.checkForUpdate();

// Stop further execution on update to prevent second tray icon
if (lifecycle.isFirstInstance) {
  appInit.addLinuxWorkarounds();
  bindIpcEvents();
  handleAppEvents();
  renameLogFile();
  new ElectronWrapperInit().run().catch(error => console.error(error));
}

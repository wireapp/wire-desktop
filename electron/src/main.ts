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

import {LogFactory} from '@wireapp/commons';
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event as ElectronEvent,
  ipcMain,
  Menu,
  OnHeadersReceivedDetails as OnHeadersReceivedListenerDetails,
  OnHeadersReceivedFilter as Filter,
  OnHeadersReceivedResponse as HeadersReceivedResponse,
  shell,
  WebContents,
} from 'electron';
import * as fs from 'fs-extra';
import {getProxySettings} from 'get-proxy-settings';
import * as logdown from 'logdown';
import * as minimist from 'minimist';
import * as path from 'path';
import {URL} from 'url';

import {
  attachTo as attachCertificateVerifyProcManagerTo,
  setCertificateVerifyProc,
} from './lib/CertificateVerifyProcManager';
import {CustomProtocolHandler} from './lib/CoreProtocol';
import {downloadImage} from './lib/download';
import {EVENT_TYPE} from './lib/eventType';
import {deleteAccount} from './lib/LocalAccountDeletion';
import * as locale from './locale/locale';
import {ENABLE_LOGGING, getLogger} from './logging/getLogger';
import {Raygun} from './logging/initRaygun';
import {getLogFiles} from './logging/loggerUtils';
import {menuItem as developerMenu} from './menu/developer';
import * as systemMenu from './menu/system';
import {TrayHandler} from './menu/TrayHandler';
import * as EnvironmentUtil from './runtime/EnvironmentUtil';
import * as lifecycle from './runtime/lifecycle';
import {OriginValidator} from './runtime/OriginValidator';
import {config} from './settings/config';
import {settings} from './settings/ConfigurationPersistence';
import {SettingsType} from './settings/SettingsType';
import {SingleSignOn} from './sso/SingleSignOn';
import {AboutWindow} from './window/AboutWindow';
import {ProxyPromptWindow} from './window/ProxyPromptWindow';
import {WindowManager} from './window/WindowManager';
import {WindowUtil} from './window/WindowUtil';
import ProxyAuth from './auth/ProxyAuth';
import WindowStateKeeper = require('electron-window-state');
import fileUrl = require('file-url');
import {changeEnvironmentPrompt} from './lib/changeEnvironmentPrompt';

const APP_PATH = path.join(app.getAppPath(), config.electronDirectory);
const INDEX_HTML = path.join(APP_PATH, 'renderer/index.html');
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron.log');
const PRELOAD_JS = path.join(APP_PATH, 'dist/renderer/preload-app.js');
const PRELOAD_RENDERER_JS = path.join(APP_PATH, 'dist/renderer/preload-webview.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css/wrapper.css');
const WINDOW_SIZE = {
  DEFAULT_HEIGHT: 768,
  DEFAULT_WIDTH: 1024,
  MIN_HEIGHT: 512,
  MIN_WIDTH: 760,
};
enum ARG {
  PROXY_URL = 'proxy-url',
}

let proxyInfoArg: URL | undefined;

const customProtocolHandler = new CustomProtocolHandler();

// Config
const argv = minimist(process.argv.slice(1));
const BASE_URL = EnvironmentUtil.web.getWebappUrl(argv.env);

const logger = getLogger(path.basename(__filename));

if (argv.version) {
  console.info(config.version);
  process.exit();
}

if (argv[ARG.PROXY_URL]) {
  try {
    proxyInfoArg = new URL(argv[ARG.PROXY_URL]);
    if (proxyInfoArg.origin === 'null') {
      proxyInfoArg = undefined;
      throw new Error('No protocol for the proxy server specified.');
    }
  } catch (error) {
    logger.error(`Could not parse authenticated proxy URL: "${error.message}"`);
  }
}

const iconFileName = `logo.${EnvironmentUtil.platform.IS_WINDOWS ? 'ico' : 'png'}`;
const iconPath = path.join(APP_PATH, 'img', iconFileName);
// This needs to stay global, see
// https://github.com/electron/electron/blob/v4.2.12/docs/faq.md#my-apps-windowtray-disappeared-after-a-few-minutes
let tray: TrayHandler;

let isFullScreen = false;
let isQuitting = false;
let main: BrowserWindow;

Object.entries(config).forEach(([key, value]) => {
  if (typeof value === 'undefined' || (typeof value === 'number' && isNaN(value))) {
    logger.warn(`Configuration key "${key}" not defined.`);
  }
});

// Squirrel setup
app.setAppUserModelId(`com.squirrel.wire.${config.name.toLowerCase()}`);

// IPC events
const bindIpcEvents = () => {
  ipcMain.on(EVENT_TYPE.ACTION.SAVE_PICTURE, (_event, bytes: Uint8Array, timestamp?: string) => {
    return downloadImage(bytes, timestamp);
  });

  ipcMain.on(EVENT_TYPE.ACTION.NOTIFICATION_CLICK, () => {
    WindowManager.showPrimaryWindow();
  });

  ipcMain.on(EVENT_TYPE.UI.BADGE_COUNT, (_event, count: number) => {
    tray.showUnreadCount(main, count);
  });

  ipcMain.on(EVENT_TYPE.ACCOUNT.DELETE_DATA, async (_event, id: number, accountId: string, partitionId?: string) => {
    await deleteAccount(id, accountId, partitionId);
    main.webContents.send(EVENT_TYPE.ACCOUNT.DATA_DELETED);
  });
  ipcMain.on(EVENT_TYPE.WRAPPER.RELAUNCH, lifecycle.relaunch);
  ipcMain.on(EVENT_TYPE.ABOUT.SHOW, AboutWindow.showWindow);
  ipcMain.on(EVENT_TYPE.UI.TOGGLE_MENU, systemMenu.toggleMenuBar);
  ipcMain.on(EVENT_TYPE.ACTION.CHANGE_ENVIRONMENT, (event, environmentUrl: string) => {
    event.returnValue = changeEnvironmentPrompt(environmentUrl);
  });
};

const checkConfigV0FullScreen = (mainWindowState: WindowStateKeeper.State) => {
  // if a user still has the old config version 0 and had the window maximized last time
  if (typeof mainWindowState.isMaximized === 'undefined' && isFullScreen === true) {
    main.maximize();
  }
};

const initWindowStateKeeper = () => {
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
    isFullScreen = showInFullScreen;
  }

  return WindowStateKeeper(stateKeeperOptions);
};

// App Windows
const showMainWindow = async (mainWindowState: WindowStateKeeper.State) => {
  const showMenuBar = settings.restore(SettingsType.SHOW_MENU_BAR, true);

  const options: BrowserWindowConstructorOptions = {
    autoHideMenuBar: !showMenuBar,
    backgroundColor: '#f7f8fa',
    height: mainWindowState.height,
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
    width: mainWindowState.width,
    // eslint-disable-next-line
    x: mainWindowState.x,
    // eslint-disable-next-line
    y: mainWindowState.y,
  };

  main = new BrowserWindow(options);

  mainWindowState.manage(main);
  attachCertificateVerifyProcManagerTo(main);
  checkConfigV0FullScreen(mainWindowState);

  let webappUrl = `${BASE_URL}${BASE_URL.includes('?') ? '&' : '?'}hl=${locale.getCurrent()}`;

  if (ENABLE_LOGGING) {
    webappUrl += `&enableLogging=@wireapp/*`;
  }

  if (customProtocolHandler.hashLocation) {
    webappUrl += `#${customProtocolHandler.hashLocation}`;
  }

  if (argv.devtools) {
    main.webContents.openDevTools({mode: 'detach'});
  }

  if (!argv.startup && !argv.hidden) {
    if (!WindowUtil.isInView(main)) {
      main.center();
    }

    WindowManager.setPrimaryWindowId(main.id);
    setTimeout(() => main.show(), 800);
  }

  main.webContents.on('will-navigate', event => {
    // Prevent any kind of navigation inside the main window
    event.preventDefault();
  });

  // Handle the new window event in the main Browser Window
  main.webContents.on('new-window', async (event, url) => {
    event.preventDefault();

    // Ensure the link does not come from a webview
    if (typeof (event as any).sender.viewInstanceId !== 'undefined') {
      logger.log('New window was created from a webview, aborting.');
      return;
    }

    await shell.openExternal(url);
  });

  main.on('focus', () => {
    systemMenu.registerGlobalShortcuts();
    main.flashFrame(false);
  });

  main.on('blur', () => systemMenu.unregisterGlobalShortcuts());

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
      systemMenu.unregisterGlobalShortcuts();
    }
  });

  main.webContents.on('crashed', event => {
    logger.error('WebContents crashed. Will reload the window.');
    logger.error(event);
    main.reload();
  });

  app.on('gpu-process-crashed', event => {
    logger.error('GPU process crashed. Will reload the window.');
    logger.error(event);
    main.reload();
  });

  await main.loadURL(`${fileUrl(INDEX_HTML)}?env=${encodeURIComponent(webappUrl)}`);
  const wrapperCSSContent = await fs.readFile(WRAPPER_CSS, 'utf8');
  await main.webContents.insertCSS(wrapperCSSContent);

  if (argv.startup || argv.hidden) {
    WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.PREFERENCES.SET_HIDDEN);
  }
};

// App Events
const handleAppEvents = () => {
  app.on('window-all-closed', () => {
    if (!EnvironmentUtil.platform.IS_MAC_OS) {
      lifecycle.quit();
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

  app.on('login', async (event, webContents, _request, authInfo, callback) => {
    if (authInfo.isProxy) {
      event.preventDefault();
      const {host, port} = authInfo;

      const systemProxy = await getProxySettings();
      const systemProxySettings = systemProxy && (systemProxy.http || systemProxy.https);
      if (systemProxySettings) {
        const {
          credentials: {username, password},
          protocol,
        } = systemProxySettings;
        proxyInfoArg = ProxyAuth.generateProxyURL({host, port}, {password, protocol, username});
        logger.log('Applying proxy settings on the main window...');
        await applyProxySettings(proxyInfoArg, main.webContents);
        return callback(username, password);
      }

      if (proxyInfoArg) {
        const hasCredentials = proxyInfoArg.username && proxyInfoArg.password;
        if (hasCredentials) {
          const {username, password} = proxyInfoArg;
          logger.info('Sending provided credentials to authenticated proxy ...');
          await applyProxySettings(proxyInfoArg, main.webContents);
          return callback(username, password);
        }
        ipcMain.once(
          EVENT_TYPE.PROXY_PROMPT.SUBMITTED,
          async (_event, promptData: {password: string; username: string}) => {
            logger.log('Proxy prompt was submitted');

            const {username, password} = promptData;
            const protocol: string | undefined = proxyInfoArg?.protocol?.replace(':', '');
            proxyInfoArg = ProxyAuth.generateProxyURL(
              {host, port},
              {
                ...promptData,
                protocol,
              },
            );

            logger.log('Applying proxy settings on the main window...');
            await applyProxySettings(proxyInfoArg, main.webContents);
            callback(username, password);
          },
        );

        ipcMain.once(EVENT_TYPE.PROXY_PROMPT.CANCELED, async () => {
          logger.log('Proxy prompt was canceled');

          await webContents.session.setProxy({
            pacScript: '',
            proxyBypassRules: '',
            proxyRules: '',
          });

          main.reload();
        });

        await ProxyPromptWindow.showWindow();
      }
    }
  });

  // System Menu, Tray Icon & Show window
  app.on('ready', async () => {
    const mainWindowState = initWindowStateKeeper();
    const appMenu = systemMenu.createMenu(isFullScreen);
    if (EnvironmentUtil.app.IS_DEVELOPMENT) {
      appMenu.append(developerMenu);
    }

    Menu.setApplicationMenu(appMenu);
    tray = new TrayHandler();
    if (!EnvironmentUtil.platform.IS_MAC_OS) {
      tray.initTray();
    }
    await showMainWindow(mainWindowState);
  });
};

const renameFileExtensions = (files: string[], oldExtension: string, newExtension: string): void => {
  for (const file of files) {
    try {
      const fileStat = fs.statSync(file);
      if (fileStat.isFile() && file.endsWith(oldExtension)) {
        fs.renameSync(file, file.replace(oldExtension, newExtension));
      }
    } catch (error) {
      logger.error(`Failed to rename log file: "${error.message}"`);
    }
  }
};

const renameWebViewLogFiles = (): void => {
  // Rename "console.log" to "console.old" (for every log directory of every account)
  try {
    const logFiles = getLogFiles(LOG_DIR, true);
    renameFileExtensions(logFiles, '.log', '.old');
  } catch (error) {
    logger.log(`Failed to read log directory with error: ${error.message}`);
  }
};

const addLinuxWorkarounds = () => {
  if (EnvironmentUtil.platform.IS_LINUX) {
    // Fix indicator icon on Unity
    // Source: https://bugs.launchpad.net/ubuntu/+bug/1559249

    if (
      EnvironmentUtil.linuxDesktop.isUbuntuUnity ||
      EnvironmentUtil.linuxDesktop.isPopOS ||
      EnvironmentUtil.linuxDesktop.isGnomeX11
    ) {
      process.env.XDG_CURRENT_DESKTOP = 'Unity';
    }
  }
};

const handlePortableFlags = () => {
  if (argv.user_data_dir || argv.portable) {
    const USER_PATH = argv.user_data_dir
      ? path.resolve(argv.user_data_dir)
      : path.join(process.env.APPIMAGE || process.execPath, '../Data');

    logger.log(`Saving user data to "${USER_PATH}".`);
    app.setPath('userData', USER_PATH);
  }
};

const applyProxySettings = async (authenticatedProxyDetails: any, webContents: Electron.WebContents) => {
  const proxyURL = authenticatedProxyDetails.origin.split('://')[1];
  logger.info(`Setting proxy on a window to URL "${proxyURL}"...`);
  webContents.session.allowNTLMCredentialsForDomains(authenticatedProxyDetails.hostname);
  await webContents.session.setProxy({
    pacScript: '',
    proxyBypassRules: '',
    proxyRules: `http=${proxyURL};https=${proxyURL}`,
  });
};

class ElectronWrapperInit {
  logger: logdown.Logger;

  constructor() {
    this.logger = LogFactory.getLogger('ElectronWrapperInit', {logFilePath: LOG_FILE});
  }

  async run(): Promise<void> {
    this.logger.log('webviewProtection init');
    this.webviewProtection();
  }

  // <webview> hardening
  webviewProtection(): void {
    const openLinkInNewWindow = (
      event: ElectronEvent,
      url: string,
      frameName: string,
      _disposition: string,
      options: BrowserWindowConstructorOptions,
    ) => {
      event.preventDefault();

      if (SingleSignOn.isSingleSignOnLoginWindow(frameName)) {
        return new SingleSignOn(main, event, url, options).init();
      }

      this.logger.log(`Opening an external window from a webview.`);
      return shell.openExternal(url);
    };

    const willNavigateInWebview = (event: ElectronEvent, url: string, baseUrl: string) => {
      // Ensure navigation is to a whitelisted domain
      if (OriginValidator.isMatchingHost(url, baseUrl)) {
        this.logger.log(`Navigating inside webview. URL: ${url}`);
      } else {
        this.logger.log(`Preventing navigation inside <webview>. URL: ${url}`);
        event.preventDefault();
      }
    };

    app.on('web-contents-created', async (_webviewEvent: ElectronEvent, contents: WebContents) => {
      if (proxyInfoArg?.origin && contents.session) {
        this.logger.log('Applying proxy settings on a webview...');
        await applyProxySettings(proxyInfoArg, contents);
      }

      switch (contents.getType()) {
        case 'window': {
          contents.on('will-attach-webview', (event, webPreferences, params) => {
            // Use secure defaults
            params.autosize = 'false';
            params.contextIsolation = 'true';
            params.plugins = 'false';
            webPreferences.allowRunningInsecureContent = false;
            webPreferences.nodeIntegration = false;
            webPreferences.preload = PRELOAD_RENDERER_JS;
            webPreferences.webSecurity = true;
            webPreferences.enableBlinkFeatures = '';
          });
          break;
        }
        case 'webview': {
          // Open webview links outside of the app
          contents.on('new-window', openLinkInNewWindow);
          contents.on('will-navigate', (event: ElectronEvent, url: string) => {
            willNavigateInWebview(event, url, contents.getURL());
          });
          if (ENABLE_LOGGING) {
            contents.on('console-message', async (_event, _level, message) => {
              const webViewId = lifecycle.getWebViewId(contents);
              if (webViewId) {
                const logFilePath = path.join(LOG_DIR, webViewId, config.logFileName);
                try {
                  await LogFactory.writeMessage(message, logFilePath);
                } catch (error) {
                  logger.error(`Cannot write to log file "${logFilePath}": ${error.message}`, error);
                }
              }
            });
          }

          contents.session.setCertificateVerifyProc(setCertificateVerifyProc);

          // Override remote Access-Control-Allow-Origin for localhost (CORS bypass)
          const isLocalhostEnvironment =
            EnvironmentUtil.getEnvironment() == EnvironmentUtil.BackendType.LOCALHOST.toUpperCase();
          if (isLocalhostEnvironment) {
            const filter: Filter = {
              urls: config.backendOrigins.map(value => `${value}/*`),
            };

            const listenerOnHeadersReceived = (
              details: OnHeadersReceivedListenerDetails,
              callback: (response: HeadersReceivedResponse) => void,
            ) => {
              const responseHeaders = {
                'Access-Control-Allow-Credentials': ['true'],
                'Access-Control-Allow-Origin': ['http://localhost:8081'],
              };

              callback({
                cancel: false,
                responseHeaders: {...details.responseHeaders, ...responseHeaders},
              });
            };

            contents.session.webRequest.onHeadersReceived(filter, listenerOnHeadersReceived);
          }

          contents.on('before-input-event', (_event, input) => {
            if (input.type === 'keyUp' && input.key === 'Alt') {
              ipcMain.emit(EVENT_TYPE.UI.TOGGLE_MENU);
            }
          });
          break;
        }
      }
    });
  }
}

customProtocolHandler.registerCoreProtocol();
Raygun.initClient();
handlePortableFlags();
lifecycle.checkSingleInstance();
lifecycle.checkForUpdate().catch(error => logger.error(error));

// Stop further execution on update to prevent second tray icon
if (lifecycle.isFirstInstance) {
  addLinuxWorkarounds();
  bindIpcEvents();
  handleAppEvents();
  renameWebViewLogFiles();
  fs.ensureFileSync(LOG_FILE);
  new ElectronWrapperInit().run().catch(error => logger.error(error));
}

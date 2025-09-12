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

import * as remoteMain from '@electron/remote/main';
import {
  app,
  dialog,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event as ElectronEvent,
  ipcMain,
  Menu,
  WebContents,
  desktopCapturer,
  safeStorage,
  HandlerDetails,
} from 'electron';
import electronDl from 'electron-dl';
import windowStateKeeper from 'electron-window-state';
import fs from 'fs-extra';
import {getProxySettings} from 'get-proxy-settings';
import logdown from 'logdown';
import minimist from 'minimist';

import * as path from 'path';
import {URL, pathToFileURL} from 'url';

import {DateUtil, LogFactory} from '@wireapp/commons';
import {WebAppEvents} from '@wireapp/webapp-events';

import * as ProxyAuth from './auth/ProxyAuth';
import {getPictureInPictureCallWindowOptions, isPictureInPictureCallWindow} from './calling/PictureInPictureCall';
import {
  attachTo as attachCertificateVerifyProcManagerTo,
  setCertificateVerifyProc,
} from './lib/CertificateVerifyProcManager';
import {CustomProtocolHandler} from './lib/CoreProtocol';
import {downloadImage} from './lib/download';
import {EVENT_TYPE} from './lib/eventType';
import {deleteAccount} from './lib/LocalAccountDeletion';
import {getOpenGraphDataAsync} from './lib/openGraph';
import {showErrorDialog} from './lib/showDialog';
import * as locale from './locale';
import {ENABLE_LOGGING, getLogger} from './logging/getLogger';
import {getLogFilenames} from './logging/loggerUtils';
import {developerMenu, openDevTools} from './menu/developer';
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
import * as WindowUtil from './window/WindowUtil';

remoteMain.initialize();

const APP_PATH = path.join(app.getAppPath(), config.electronDirectory);
const INDEX_HTML = path.join(APP_PATH, 'renderer/index.html');
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron.log');
const PRELOAD_JS = path.join(APP_PATH, 'dist/preload/preload-app.js');
const PRELOAD_RENDERER_JS = path.join(APP_PATH, 'dist/preload/preload-webview.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css/wrapper.css');
const ICON = path.join(APP_PATH, 'img/download-dialog/logo@2x.png');

const WINDOW_SIZE = {
  DEFAULT_HEIGHT: 768,
  DEFAULT_WIDTH: 1024,
  MIN_HEIGHT: 512,
  MIN_WIDTH: 398,
};

let proxyInfoArg: URL | undefined;

const customProtocolHandler = new CustomProtocolHandler();

// Config
const argv = minimist(process.argv.slice(1));
const fileBasedProxyConfig = settings.restore<string | undefined>(SettingsType.PROXY_SERVER_URL);

const logger = getLogger(path.basename(__filename));
const currentLocale = locale.getCurrent();
const startHidden = Boolean(argv[config.ARGUMENT.STARTUP] || argv[config.ARGUMENT.HIDDEN]);
const customDownloadPath = settings.restore<string | undefined>(SettingsType.DOWNLOAD_PATH);
const appHomePath = (path: string) => `${app.getPath('home')}\\${path}`;

if (customDownloadPath) {
  electronDl({
    directory: appHomePath(customDownloadPath),
    saveAs: false,
    onCompleted: () => {
      dialog.showMessageBox({
        type: 'none',
        icon: ICON,
        title: locale.getText('enforcedDownloadComplete'),
        message: locale.getText('enforcedDownloadMessage', {
          path: appHomePath(customDownloadPath) ?? app.getPath('downloads'),
        }),
        buttons: [locale.getText('enforcedDownloadButton')],
      });
    },
  });
}

if (argv[config.ARGUMENT.VERSION]) {
  console.info(config.version);
  app.exit();
}

logger.info(`Initializing ${config.name} v${config.version} ...`);

if (argv[config.ARGUMENT.PROXY_SERVER] || fileBasedProxyConfig) {
  try {
    proxyInfoArg = new URL(argv[config.ARGUMENT.PROXY_SERVER] || fileBasedProxyConfig);
    if (!argv[config.ARGUMENT.PROXY_SERVER] && fileBasedProxyConfig) {
      logger.info(`Using proxy server URL from "init.json": ${fileBasedProxyConfig}`);
      app.commandLine.appendSwitch('proxy-server', fileBasedProxyConfig);
    }
    if (!/^(https?|socks[45]):$/.test(proxyInfoArg.protocol)) {
      throw new Error('Invalid protocol for the proxy server specified.');
    }
    if (proxyInfoArg.origin === 'null') {
      proxyInfoArg = undefined;
      throw new Error('No protocol for the proxy server specified.');
    }
  } catch (error) {
    logger.error(`Could not parse authenticated proxy URL: "${(error as any).message}"`);
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
app.setAppUserModelId(config.appUserModelId);

// do not use mdns for local ip obfuscation to prevent windows firewall prompt
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');

app.getGPUInfo('basic').then((info: any) => {
  const gpuDevices = 'gpuDevice' in info ? info.gpuDevice : [];
  if (gpuDevices.length > 0) {
    logger.info('No GPU device found, disabling hardware acceleration');
    app.disableHardwareAcceleration();
  }
});

// IPC events
const bindIpcEvents = (): void => {
  ipcMain.on(EVENT_TYPE.ACTION.SAVE_PICTURE, (_event, bytes: Uint8Array, timestamp?: string) => {
    return downloadImage(bytes, timestamp);
  });

  ipcMain.on(EVENT_TYPE.ACTION.NOTIFICATION_CLICK, () => WindowManager.showPrimaryWindow());
  ipcMain.on(EVENT_TYPE.WEBAPP.APP_LOADED, () => WindowManager.flushActionsQueue());

  ipcMain.on(EVENT_TYPE.UI.BADGE_COUNT, (_event, {count, ignoreFlash}: {count?: number; ignoreFlash?: boolean}) => {
    tray.showUnreadCount(main, count, ignoreFlash);
  });

  ipcMain.on(EVENT_TYPE.ACCOUNT.DELETE_DATA, async (_event, id: number, accountId: string, partitionId?: string) => {
    await deleteAccount(id, accountId, partitionId);
    main.webContents.send(EVENT_TYPE.ACCOUNT.DATA_DELETED);
  });
  ipcMain.on(EVENT_TYPE.WRAPPER.RELAUNCH, () => lifecycle.relaunch());
  ipcMain.on(EVENT_TYPE.ABOUT.SHOW, () => AboutWindow.showWindow());

  ipcMain.handle(EVENT_TYPE.ACTION.GET_OG_DATA, (_event, url) => getOpenGraphDataAsync(url));

  ipcMain.on(EVENT_TYPE.ACTION.CHANGE_DOWNLOAD_LOCATION, (_event, downloadPath?: string) => {
    if (EnvironmentUtil.platform.IS_WINDOWS) {
      if (downloadPath) {
        fs.ensureDirSync(appHomePath(downloadPath));
      }
      //save the downloadPath locally
      settings.save(SettingsType.DOWNLOAD_PATH, downloadPath);
      settings.persistToFile();
    }
  });
};

const checkConfigV0FullScreen = (mainWindowState: windowStateKeeper.State): void => {
  // if a user still has the old config version 0 and had the window maximized last time
  if (typeof mainWindowState.isMaximized === 'undefined' && isFullScreen === true) {
    main.maximize();
  }
};

const initWindowStateKeeper = (): windowStateKeeper.State => {
  const loadedWindowBounds = settings.restore(SettingsType.WINDOW_BOUNDS, {
    height: WINDOW_SIZE.DEFAULT_HEIGHT,
    width: WINDOW_SIZE.DEFAULT_WIDTH,
  });

  // load version 0 full screen setting
  const showInFullScreen = settings.restore(SettingsType.FULL_SCREEN, 'not-set-in-v0');

  const stateKeeperOptions: windowStateKeeper.Options = {
    defaultHeight: loadedWindowBounds.height,
    defaultWidth: loadedWindowBounds.width,
    path: path.join(app.getPath('userData'), 'config'),
  };

  if (showInFullScreen !== 'not-set-in-v0') {
    stateKeeperOptions.fullScreen = showInFullScreen as boolean;
    stateKeeperOptions.maximize = showInFullScreen as boolean;
    isFullScreen = showInFullScreen as boolean;
  }

  return windowStateKeeper(stateKeeperOptions);
};

function getMainWindowUrl() {
  const baseUrl = EnvironmentUtil.web.getWebappUrl();
  const webappURL = new URL(baseUrl);
  webappURL.searchParams.set('hl', currentLocale);

  if (ENABLE_LOGGING) {
    webappURL.searchParams.set('enableLogging', '@wireapp/*');
  }

  if (customProtocolHandler.hashLocation) {
    webappURL.hash = customProtocolHandler.hashLocation;
  }
  const mainURL = pathToFileURL(INDEX_HTML);
  mainURL.searchParams.set('env', encodeURIComponent(webappURL.href));
  mainURL.searchParams.set('focus', String(!startHidden));
  return mainURL;
}

// App Windows
const showMainWindow = async (mainWindowState: windowStateKeeper.State): Promise<void> => {
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
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: false,
      nodeIntegration: false,
      preload: PRELOAD_JS,
      sandbox: false,
      webviewTag: true,
    },
    width: mainWindowState.width,
    // eslint-disable-next-line id-length
    x: mainWindowState.x,
    // eslint-disable-next-line id-length
    y: mainWindowState.y,
  };

  ipcMain.handle(EVENT_TYPE.ACTION.GET_DESKTOP_SOURCES, (event, opts) => desktopCapturer.getSources(opts));
  ipcMain.handle(EVENT_TYPE.ACTION.ENCRYPT, (event, plaintext: string) => safeStorage.encryptString(plaintext));
  ipcMain.handle(EVENT_TYPE.ACTION.DECRYPT, (event, encrypted: Uint8Array) =>
    safeStorage.decryptString(Buffer.from(encrypted)),
  );

  main = new BrowserWindow(options);

  remoteMain.enable(main.webContents);

  main.setMenuBarVisibility(showMenuBar);

  mainWindowState.manage(main);
  attachCertificateVerifyProcManagerTo(main);
  checkConfigV0FullScreen(mainWindowState);

  if (typeof argv[config.ARGUMENT.DEVTOOLS] !== 'undefined') {
    openDevTools(argv[config.ARGUMENT.DEVTOOLS]).catch(() =>
      logger.warn(`Could not open DevTools with index "${argv[config.ARGUMENT.DEVTOOLS]}". Does the account exist?`),
    );
  }

  if (!startHidden) {
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
  main.webContents.setWindowOpenHandler(details => {
    return {action: 'deny'};
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

  app.on('render-process-gone', async (event, _, details) => {
    logger.error('WebContents crashed. Will reload the window.');
    logger.error(JSON.stringify(details));
    try {
      main.reload();
    } catch (error) {
      showErrorDialog(`Could not reload the window: ${(error as any).message}`);
      logger.error('Could not reload the window:', error);
    }
  });

  app.on('child-process-gone', (event, details) => {
    logger.error('child process gone');
    logger.error(event);
    logger.error(details);
  });

  main.webContents.setZoomFactor(1);

  const mainURL = getMainWindowUrl();
  await main.loadURL(mainURL.href);
  const wrapperCSSContent = await fs.readFile(WRAPPER_CSS, 'utf8');
  await main.webContents.insertCSS(wrapperCSSContent);
};

// App Events
const handleAppEvents = (): void => {
  app.on('window-all-closed', async () => {
    if (!EnvironmentUtil.platform.IS_MAC_OS) {
      await lifecycle.quit();
    }
  });

  app.on('activate', () => {
    if (main) {
      main.show();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('login', async (event, webContents, _responseDetails, authInfo, callback) => {
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
        logger.log('Found system proxy settings, applying settings on the main window...');

        await applyProxySettings(proxyInfoArg, main.webContents);
        return callback(username, password);
      }

      if (proxyInfoArg) {
        ipcMain.once(
          EVENT_TYPE.PROXY_PROMPT.SUBMITTED,
          async (_event, promptData: {password: string; username: string}) => {
            logger.log('Proxy info was submitted via prompt');

            const {username, password} = promptData;
            // remove the colon from the protocol to align it with other usages of `generateProxyURL`
            const protocol = proxyInfoArg?.protocol?.replace(':', '');
            proxyInfoArg = ProxyAuth.generateProxyURL(
              {host, port},
              {
                ...promptData,
                protocol,
              },
            );

            logger.log('Proxy prompt was submitted, applying proxy settings on the main window...');
            await applyProxySettings(proxyInfoArg, main.webContents);
            callback(username, password);
          },
        );

        ipcMain.once(EVENT_TYPE.PROXY_PROMPT.CANCELED, async () => {
          logger.log('Proxy prompt was canceled');

          // TODO: check if we should use `mode: 'auto_detect'` here
          await webContents.session.setProxy({});

          try {
            main.reload();
          } catch (error) {
            showErrorDialog(`Could not reload the window: ${(error as any).message}`);
            logger.error('Could not reload the window:', error);
          }
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
      logger.error(`Failed to rename log file: "${(error as any).message}"`);
    }
  }
};

const renameWebViewLogFiles = (): void => {
  // Rename "console.log" to "console.old" (for every log directory of every account)
  try {
    const logFiles = getLogFilenames(LOG_DIR, true);
    renameFileExtensions(logFiles, '.log', '.old');
  } catch (error) {
    logger.log(`Failed to read log directory with error: ${(error as any).message}`);
  }
};

const addLinuxWorkarounds = (): void => {
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

const handlePortableFlags = (): void => {
  if (argv[config.ARGUMENT.USER_DATA_DIR] || argv[config.ARGUMENT.PORTABLE]) {
    const USER_PATH = argv[config.ARGUMENT.USER_DATA_DIR]
      ? path.resolve(argv[config.ARGUMENT.USER_DATA_DIR])
      : path.join(process.env.APPIMAGE || process.execPath, '../Data');

    logger.log(`Saving user data to "${USER_PATH}".`);
    app.setPath('userData', USER_PATH);
  }
};

const applyProxySettings = async (authenticatedProxyDetails: URL, webContents: Electron.WebContents): Promise<void> => {
  const proxyURL = authenticatedProxyDetails.origin.split('://')[1];
  const proxyProtocol = authenticatedProxyDetails.protocol;
  const isSocksProxy = proxyProtocol === 'socks4:' || proxyProtocol === 'socks5:';

  logger.info(`Setting proxy on the window to URL "${proxyURL}" with protocol "${proxyProtocol}"...`);
  webContents.session.allowNTLMCredentialsForDomains(authenticatedProxyDetails.hostname);

  const proxyRules = isSocksProxy ? `socks=${proxyURL}` : `http=${proxyURL};https=${proxyURL}`;
  await webContents.session.setProxy({pacScript: '', proxyBypassRules: '', proxyRules});
};

class ElectronWrapperInit {
  logger: logdown.Logger;
  ssoWindow: SingleSignOn | null;

  constructor() {
    this.logger = getLogger('ElectronWrapperInit');
    this.ssoWindow = null;
    ipcMain.on(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSE, this.closeSSOWindow);
    ipcMain.on(WebAppEvents.LIFECYCLE.SSO_WINDOW_FOCUS, this.focusSSOWindow);
  }

  async run(): Promise<void> {
    this.logger.log('webviewProtection init');
    this.webviewProtection();
  }

  closeSSOWindow = () => {
    if (this.ssoWindow) {
      this.ssoWindow?.close();
      this.ssoWindow = null;
    }
  };

  focusSSOWindow = () => {
    if (this.ssoWindow) {
      this.ssoWindow.focus();
    }
  };

  sendSSOWindowCloseEvent = () => {
    if (this.ssoWindow) {
      main.webContents.send(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSED);
    }
  };

  // <webview> hardening
  webviewProtection(): void {
    const openLinkInNewWindowHandler = (
      details: HandlerDetails,
    ): {action: 'deny'} | {action: 'allow'; overrideBrowserWindowOptions?: BrowserWindowConstructorOptions} => {
      if (SingleSignOn.isSingleSignOnLoginWindow(details.frameName)) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: SingleSignOn.getSingleSignOnLoginWindowOptions(main, details.url),
        };
      }

      if (isPictureInPictureCallWindow(details.frameName)) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: getPictureInPictureCallWindowOptions(),
        };
      }

      this.logger.log('Opening an external window from a webview.');
      void WindowUtil.openExternal(details.url);
      return {action: 'deny'};
    };

    const openLinkInNewWindow = (
      win: BrowserWindow,
      url: string,
      event: ElectronEvent,
      frameName: string,
      options: BrowserWindowConstructorOptions,
    ): Promise<void> | void => {
      if (SingleSignOn.isSingleSignOnLoginWindow(frameName)) {
        const singleSignOn = new SingleSignOn(win, event, url, options).init();
        return new Promise(() => {
          singleSignOn
            .then(sso => {
              this.ssoWindow = sso;
              this.ssoWindow.onClose = this.sendSSOWindowCloseEvent;
            })
            .catch(error => console.info(error));
        });
      }
    };

    // Keeping this Function for future use
    const willNavigateInWebview = (event: ElectronEvent, url: string, baseUrl: string): void => {
      // Ensure navigation is to an allowed domain
      if (OriginValidator.isMatchingHost(url, baseUrl)) {
        this.logger.log(`Navigating inside <webview>. URL: ${url}`);
      } else {
        // ToDo: Add a back button to the webview to navigate back to the main app
        this.logger.log(`Navigating outside <webview>. URL: ${url}`);
      }
    };

    const enableSpellChecking = settings.restore(SettingsType.ENABLE_SPELL_CHECKING, true);

    app.on('web-contents-created', async (webviewEvent: ElectronEvent, contents: WebContents) => {
      remoteMain.enable(contents);
      // disable new Windows by default on everything
      contents.setWindowOpenHandler(() => {
        return {action: 'deny'};
      });
      switch (contents.getType()) {
        case 'window': {
          contents.on('will-attach-webview', (_event, webPreferences, params) => {
            // Use secure defaults
            params.autosize = 'false';
            params.contextIsolation = 'true';
            params.plugins = 'false';
            webPreferences.allowRunningInsecureContent = false;
            webPreferences.contextIsolation = false;
            webPreferences.experimentalFeatures = false;
            webPreferences.nodeIntegration = false;
            webPreferences.preload = PRELOAD_RENDERER_JS;
            webPreferences.spellcheck = enableSpellChecking;
            webPreferences.webSecurity = true;
            webPreferences.sandbox = false;
          });
          break;
        }
        case 'webview': {
          if (proxyInfoArg?.origin && contents.session) {
            this.logger.log('Found proxy settings in arguments, applying settings on the webview...');
            await applyProxySettings(proxyInfoArg, contents);
          }
          // Open webview links outside of the app
          contents.setWindowOpenHandler(openLinkInNewWindowHandler);
          contents.on('did-create-window', async (win, {url, frameName, options}) => {
            await openLinkInNewWindow(win, url, webviewEvent, frameName, options);
          });
          contents.on('will-navigate', (event: ElectronEvent, url: string) => {
            willNavigateInWebview(event, url, contents.getURL());
          });
          if (ENABLE_LOGGING) {
            const colorCodeRegex = /%c(.+?)%c/gm;
            const stylingRegex = /(color:#|font-weight:)[^;]+; /gm;
            const accessTokenRegex = /access_token=[^ &]+/gm;
            const {date, time} = DateUtil.isoFormat(new Date());

            contents.on('console-message', async (_event, _level, message) => {
              const webViewId = lifecycle.getWebViewId(contents);
              /*
               * Note: WebContents with ID `1` is the main window, `2` is the
               * sidebar and `3` is the first account.
               */
              const accountIndex = contents.id - 2;

              if (webViewId) {
                const logFilePath = path.join(
                  LOG_DIR,
                  `${accountIndex}_${date.replaceAll('-', '_')}_${time.replaceAll(':', '_')}_${webViewId}`,
                  config.logFileName,
                );
                try {
                  await LogFactory.writeMessage(
                    message.replace(colorCodeRegex, '$1').replace(stylingRegex, '').replace(accessTokenRegex, ''),
                    logFilePath,
                  );
                } catch (error) {
                  logger.error(`Cannot write to log file "${logFilePath}": ${(error as any).message}`, error);
                }
              }
            });
          }

          if (enableSpellChecking) {
            try {
              const availableSpellCheckerLanguages = contents.session.availableSpellCheckerLanguages;
              const foundLanguages = locale.supportedSpellCheckLanguages[currentLocale].filter(language =>
                availableSpellCheckerLanguages.includes(language),
              );
              contents.session.setSpellCheckerLanguages(foundLanguages);
            } catch (error) {
              logger.error(error);
              contents.session.setSpellCheckerLanguages([]);
            }
          }

          // Disable TLS < v1.2
          contents.session.setSSLConfig({minVersion: 'tls1.2'});

          contents.session.setCertificateVerifyProc(setCertificateVerifyProc);

          contents.on('before-input-event', (_event, input) => {
            if (input.type === 'keyUp' && input.key === 'Alt') {
              const mainBrowserWindow = WindowManager.getPrimaryWindow();

              if (mainBrowserWindow) {
                const isAutoHide = mainBrowserWindow.isMenuBarAutoHide();
                const isVisible = mainBrowserWindow.isMenuBarVisible();
                if (isAutoHide) {
                  mainBrowserWindow.setMenuBarVisibility(!isVisible);
                }
              }
            }
          });

          break;
        }
      }
    });
  }
}

customProtocolHandler.registerCoreProtocol();
handlePortableFlags();
lifecycle
  .checkSingleInstance()
  .then(() => lifecycle.initSquirrelListener())
  .catch(error => logger.error(error));

// Reloads the entire view when a `relaunch` is triggered (MacOS only, as other platform will quit and restart the app)
lifecycle.addRelaunchListeners(async () => {
  const mainURL = getMainWindowUrl();
  await main.loadURL(mainURL.href);
});

// Stop further execution on update to prevent second tray icon
if (lifecycle.isFirstInstance) {
  addLinuxWorkarounds();
  bindIpcEvents();
  handleAppEvents();
  renameWebViewLogFiles();
  fs.ensureFileSync(LOG_FILE);
  new ElectronWrapperInit().run().catch(error => logger.error(error));
}

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
const debug = require('debug');
const debugMain = debug('mainTmp');
const fileUrl = require('file-url');
const fs = require('fs-extra');
const minimist = require('minimist');
const path = require('path');
const {BrowserWindow, Menu, app, ipcMain, session, shell} = require('electron');

// Paths
const APP_PATH = app.getAppPath();

// Local files
const ABOUT_HTML = fileUrl(path.join(APP_PATH, 'html', 'about.html'));
const ABOUT_WINDOW_WHITELIST = [
  ABOUT_HTML,
  fileUrl(path.join(APP_PATH, 'img', 'wire.256.png')),
  fileUrl(path.join(APP_PATH, 'css', 'about.css')),
];
const CERT_ERR_HTML = fileUrl(path.join(APP_PATH, 'html', 'certificate-error.html'));
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const PRELOAD_JS = path.join(APP_PATH, 'js', 'preload.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css', 'wrapper.css');

// Configuration persistence
const settings = require('./js/lib/settings');

// Wrapper modules
const appInit = require('./js/appInit');
const certificateUtils = require('./js/certificateUtils');
const config = require('./js/config');
const developerMenu = require('./js/menu/developer');
const download = require('./js/lib/download');
const environment = require('./js/environment');
const googleAuth = require('./js/lib/googleAuth');
const initRaygun = require('./js/initRaygun');
const lifecycle = require('./js/lifecycle');
const locale = require('./locale/locale');
const systemMenu = require('./js/menu/system');
const tray = require('./js/menu/tray');
const util = require('./js/util');
const windowManager = require('./js/window-manager');
const EVENT_TYPE = require('./js/lib/eventType');

// Config
const argv = minimist(process.argv.slice(1));
const BASE_URL = environment.web.getWebappUrl(argv.env);
const pkg = require('./package.json');

// Icon
const ICON = `wire.${environment.platform.IS_WINDOWS ? 'ico' : 'png'}`;
const ICON_PATH = path.join(APP_PATH, 'img', ICON);

let main;
let about;
let quitting = false;
let webappVersion;

// IPC events
const bindIpcEvents = () => {
  ipcMain.once(EVENT_TYPE.UI.WEBAPP_VERSION, (event, version) => {
    webappVersion = version;
  });

  ipcMain.on(EVENT_TYPE.ACTION.SAVE_PICTURE, (event, fileName, bytes) => {
    download(fileName, bytes);
  });

  ipcMain.on(EVENT_TYPE.ACTION.NOTIFICATION_CLICK, () => {
    windowManager.showPrimaryWindow();
  });

  ipcMain.on(EVENT_TYPE.UI.BADGE_COUNT, (event, count) => {
    tray.updateBadgeIcon(main, count);
  });

  ipcMain.on(EVENT_TYPE.GOOGLE_OAUTH.REQUEST, event => {
    googleAuth
      .getAccessToken(config.GOOGLE_SCOPES, config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET)
      .then(code => event.sender.send('google-auth-success', code.access_token))
      .catch(error => event.sender.send('google-auth-error', error));
  });

  ipcMain.on(EVENT_TYPE.ACCOUNT.DELETE_DATA, (event, accountID, sessionID) => {
    // delete webview partition
    try {
      if (sessionID) {
        const partitionDir = path.join(app.getPath('userData'), 'Partitions', sessionID);
        fs.removeSync(partitionDir);
        debugMain(`Deleted partition for account: ${sessionID}`);
      } else {
        debugMain(`Skipping partition deletion for account: ${accountID}`);
      }
    } catch (error) {
      debugMain(`Failed to partition for account: ${sessionID}`);
    }

    // delete logs
    try {
      fs.removeSync(LOG_DIR);
      debugMain(`Deleted logs folder for account: ${accountID}`);
    } catch (error) {
      debugMain(`Failed to delete logs folder for account: ${accountID} with error: ${error.message}`);
    }
  });

  ipcMain.on(EVENT_TYPE.WRAPPER.RELAUNCH, () => lifecycle.relaunch());
};

// App Windows
const showMainWindow = () => {
  main = new BrowserWindow({
    autoHideMenuBar: !settings.restore('showMenu', true),
    backgroundColor: '#f7f8fa',
    height: config.WINDOW.MAIN.DEFAULT_HEIGHT,
    icon: ICON_PATH,
    minHeight: config.WINDOW.MAIN.MIN_HEIGHT,
    minWidth: config.WINDOW.MAIN.MIN_WIDTH,
    show: false,
    title: config.NAME,
    titleBarStyle: 'hidden-inset',
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      preload: PRELOAD_JS,
      webviewTag: true,
    },
    width: config.WINDOW.MAIN.DEFAULT_WIDTH,
  });

  if (settings.restore('fullscreen', false)) {
    main.setFullScreen(true);
  } else {
    main.setBounds(settings.restore('bounds', main.getBounds()));
  }

  let baseURL = BASE_URL;
  baseURL += `${baseURL.includes('?') ? '&' : '?'}hl=${locale.getCurrent()}`;
  main.loadURL(`file://${__dirname}/renderer/index.html?env=${encodeURIComponent(baseURL)}`);

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

  main.webContents.on('will-navigate', (event, url) => {
    // Prevent any kind of navigation inside the main window
    event.preventDefault();
  });

  // Handle the new window event in the main Browser Window
  main.webContents.on('new-window', (event, _url) => {
    event.preventDefault();

    // Ensure the link does not come from a webview
    if (typeof event.sender.viewInstanceId !== 'undefined') {
      debugMain('New window was created from a webview, aborting.');
      return;
    }

    shell.openExternal(_url);
  });

  main.webContents.session.webRequest.onHeadersReceived(
    {
      urls: ['https://staging-nginz-https.zinfra.io/*'],
    },
    (details, callback) => {
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

  main.on('focus', () => {
    main.flashFrame(false);
  });

  main.on('page-title-updated', () => {
    tray.updateBadgeIcon(main);
  });

  main.on('close', async event => {
    const isFullScreen = main.isFullScreen();
    settings.save('fullscreen', isFullScreen);

    if (!isFullScreen) {
      settings.save('bounds', main.getBounds());
    }

    if (!quitting) {
      event.preventDefault();
      debugMain('Closing window...');

      if (isFullScreen) {
        main.once('leave-full-screen', () => {
          main.hide();
        });
        main.setFullScreen(false);
      } else {
        main.hide();
      }
    }
  });

  main.webContents.on('crashed', () => {
    main.reload();
  });
};

const showAboutWindow = () => {
  if (!about) {
    about = new BrowserWindow({
      alwaysOnTop: true,
      backgroundColor: '#fff',
      fullscreen: false,
      height: config.WINDOW.ABOUT.HEIGHT,
      maximizable: false,
      minimizable: false,
      resizable: false,
      show: false,
      title: config.NAME,
      webPreferences: {
        javascript: false,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        preload: path.join(APP_PATH, 'js', 'preload-about.js'),
        sandbox: true,
        session: session.fromPartition('about-window'),
        webviewTag: false,
      },
      width: config.WINDOW.ABOUT.WIDTH,
    });
    about.setMenuBarVisibility(false);

    // Prevent any kind of navigation
    // will-navigate is broken with sandboxed env, intercepting requests instead
    // see https://github.com/electron/electron/issues/8841
    about.webContents.session.webRequest.onBeforeRequest(
      {
        urls: ['*'],
      },
      (details, callback) => {
        const url = details.url;

        // Only allow those URLs to be opened within the window
        if (ABOUT_WINDOW_WHITELIST.includes(url)) {
          return callback({cancel: false});
        }

        // Open HTTPS links in browser instead
        if (url.startsWith('https://')) {
          shell.openExternal(url);
        } else {
          console.log('Attempt to open URL in window prevented, url: %s', url);
        }

        callback({redirectURL: ABOUT_HTML});
      }
    );

    // Locales
    ipcMain.on(EVENT_TYPE.ABOUT.LOCALE_VALUES, (event, labels) => {
      if (event.sender.id !== about.webContents.id) {
        return;
      }
      const resultLabels = {};
      for (const label of labels) {
        resultLabels[label] = locale.getText(label);
      }
      event.sender.send(EVENT_TYPE.ABOUT.LOCALE_RENDER, resultLabels);
    });

    // Close window via escape
    about.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'Escape') {
        about.close();
      }
    });

    about.on('closed', () => {
      about = undefined;
    });

    about.loadURL(ABOUT_HTML);

    about.webContents.on('dom-ready', () => {
      about.webContents.send(EVENT_TYPE.ABOUT.LOADED, {
        electronVersion: pkg.version,
        productName: pkg.productName,
        webappVersion: webappVersion,
      });
    });
  }
  about.show();
};

// App Events
const handleAppEvents = () => {
  app.on('window-all-closed', event => {
    if (!environment.platform.IS_MAC_OS) {
      lifecycle.quit();
    }
  });

  app.on('activate', () => {
    if (main) {
      main.show();
    }
  });

  app.on('before-quit', () => (quitting = true));

  app.on('quit', async () => await settings.persistToFile());

  // System Menu & Tray Icon & Show window
  app.on('ready', () => {
    const appMenu = systemMenu.createMenu();
    if (environment.app.IS_DEVELOPMENT) {
      appMenu.append(developerMenu);
    }
    appMenu.on(EVENT_TYPE.ABOUT.SHOW, () => showAboutWindow());

    Menu.setApplicationMenu(appMenu);
    tray.createTrayIcon();
    showMainWindow();
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
          fs.renameSync(file, file.replace('.log', '.old'));
        }
      });
  });
};

class ElectronWrapperInit {
  constructor() {
    this.debug = debug('ElectronWrapperInit');
  }

  async run() {
    this.debug('webviewProtection init');
    this.webviewProtection();
  }

  // <webview> hardening
  webviewProtection() {
    const webviewProtectionDebug = debug('ElectronWrapperInit:webviewProtection');

    const openLinkInNewWindow = (event, _url) => {
      // Prevent default behavior
      event.preventDefault();

      webviewProtectionDebug('Opening an external window from a webview. URL: %s', _url);
      shell.openExternal(_url);
    };

    const willNavigateInWebview = (event, _url) => {
      // Ensure navigation is to a whitelisted domain
      if (util.isMatchingHost(_url, BASE_URL)) {
        webviewProtectionDebug('Navigating inside webview. URL: %s', _url);
      } else {
        webviewProtectionDebug('Preventing navigation inside webview. URL: %s', _url);
        event.preventDefault();
      }
    };

    app.on('web-contents-created', (webviewEvent, contents) => {
      switch (contents.getType()) {
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
              webviewProtectionDebug('Prevented to show an unauthorized <webview>. URL: %s', _url);
            }
          });
          break;

        case 'webview':
          // Open webview links outside of the app
          contents.on('new-window', openLinkInNewWindow);
          contents.on('will-navigate', willNavigateInWebview);

          contents.session.setCertificateVerifyProc((request, cb) => {
            const {hostname = '', certificate = {}, error} = request;

            if (typeof error !== 'undefined') {
              console.error('setCertificateVerifyProc', error);
              main.loadURL(CERT_ERR_HTML);
              return cb(-2);
            }

            if (certificateUtils.hostnameShouldBePinned(hostname)) {
              const pinningResults = certificateUtils.verifyPinning(hostname, certificate);

              for (const result of Object.values(pinningResults)) {
                if (result === false) {
                  console.error(`Certificate verification failed for "${hostname}":\n${pinningResults.errorMessage}`);
                  main.loadURL(CERT_ERR_HTML);
                  return cb(-2);
                }
              }
            }

            return cb(-3);
          });
          break;
      }
    });
  }
}

initRaygun.initClient();
appInit.ignoreCertificateErrors();
appInit.handlePortableFlag();
lifecycle.checkSingleInstance();
lifecycle.checkForUpdate();

// Stop further execution on update to prevent second tray icon
if (!lifecycle.shouldQuit) {
  appInit.fixUnityIcon();
  bindIpcEvents();
  handleAppEvents();
  renameLogFile();
  new ElectronWrapperInit().run();
}

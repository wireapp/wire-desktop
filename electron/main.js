/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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
const fs = require('fs-extra');
const minimist = require('minimist');
const path = require('path');
const raygun = require('raygun');
const { app, BrowserWindow, globalShortcut, ipcMain, Menu, shell } = require('electron');

// Paths
const APP_PATH = app.getAppPath();
// Local files defines
const ABOUT_HTML = `file://${path.join(APP_PATH, 'html', 'about.html')}`;
const CERT_ERR_HTML = `file://${path.join(APP_PATH, 'html', 'certificate-error.html')}`;
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const PRELOAD_JS = path.join(APP_PATH, 'js', 'preload.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css', 'wrapper.css');

// Configuration persistence
const settings = require('./js/lib/settings');

// Wrapper modules
const certutils = require('./js/certutils');
const config = require('./js/config');
const developerMenu = require('./js/menu/developer');
const download = require('./js/lib/download');
const environment = require('./js/environment');
const googleAuth = require('./js/lib/googleAuth');
const locale = require('./locale/locale');
const systemMenu = require('./js/menu/system');
const tray = require('./js/menu/tray');
const util = require('./js/util');
const windowManager = require('./js/window-manager');

// Config
const argv = minimist(process.argv.slice(1));
const BASE_URL = environment.web.get_url_webapp(argv.env);

// Icon
const ICON = `wire.${environment.platform.IS_WINDOWS ? 'ico' : 'png'}`;
const ICON_PATH = path.join(APP_PATH, 'img', ICON);

let main;
let raygunClient;
let about;
let quitting = false;
let shouldQuit = false;
let webappVersion;

///////////////////////////////////////////////////////////////////////////////
// Misc
///////////////////////////////////////////////////////////////////////////////
raygunClient = new raygun.Client().init({ apiKey: config.RAYGUN_API_KEY });

raygunClient.onBeforeSend(payload => {
  delete payload.details.machineName;
  return payload;
});

if (environment.app.IS_DEVELOPMENT) {
  app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
}

if (argv.portable) {
  const EXEC_PATH = process.env.APPIMAGE || process.execPath;
  const USER_PATH = path.join(EXEC_PATH, '..', 'Data');
  app.setPath('userData', USER_PATH);
}

///////////////////////////////////////////////////////////////////////////////
// Single Instance stuff
///////////////////////////////////////////////////////////////////////////////

// makeSingleInstance will crash the signed mas app
// see: https://github.com/atom/electron/issues/4688
if (!environment.platform.IS_MAC_OS) {
  shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
    if (main) {
      windowManager.showPrimaryWindow();
    }
    return true;
  });

  if (!environment.platform.IS_WINDOWS && shouldQuit) {
    // Using exit instead of quit for the time being
    // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
    app.exit();
  }
}

///////////////////////////////////////////////////////////////////////////////
// Auto Update
///////////////////////////////////////////////////////////////////////////////
if (environment.platform.IS_WINDOWS) {
  const squirrel = require('./js/squirrel');
  squirrel.handleSquirrelEvent(shouldQuit);

  ipcMain.on('wrapper-update', () => squirrel.installUpdate());

  // Stop further execution on update to prevent second tray icon
  if (shouldQuit) {
    return;
  }
}

///////////////////////////////////////////////////////////////////////////////
// Fix indicator icon on Unity
// Source: https://bugs.launchpad.net/ubuntu/+bug/1559249
///////////////////////////////////////////////////////////////////////////////
if (environment.platform.IS_LINUX) {
  const isUbuntuUnity = process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('Unity');

  if (isUbuntuUnity) {
    process.env.XDG_CURRENT_DESKTOP = 'Unity';
  }
}

///////////////////////////////////////////////////////////////////////////////
// IPC events
///////////////////////////////////////////////////////////////////////////////
ipcMain.once('webapp-version', (event, version) => {
  webappVersion = version;
});

ipcMain.on('save-picture', (event, fileName, bytes) => {
  download(fileName, bytes);
});

ipcMain.on('notification-click', () => {
  windowManager.showPrimaryWindow();
});

ipcMain.on('badge-count', (event, count) => {
  tray.updateBadgeIcon(main, count);
});

ipcMain.on('google-auth-request', event => {
  googleAuth
    .getAccessToken(config.GOOGLE_SCOPES, config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET)
    .then(code => event.sender.send('google-auth-success', code.access_token))
    .catch(error => event.sender.send('google-auth-error', error));
});

ipcMain.on('delete-account-data', (e, accountID, sessionID) => {
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

ipcMain.on('wrapper-relaunch', () => relaunchApp());

const relaunchApp = () => {
  app.relaunch();
  // Using exit instead of quit for the time being
  // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
  app.exit();
};

///////////////////////////////////////////////////////////////////////////////
// APP Windows
///////////////////////////////////////////////////////////////////////////////
const showMainWindow = () => {
  main = new BrowserWindow({
    title: config.NAME,
    titleBarStyle: 'hidden-inset',
    width: config.WINDOW.MAIN.DEFAULT_WIDTH,
    height: config.WINDOW.MAIN.DEFAULT_HEIGHT,
    minWidth: config.WINDOW.MAIN.MIN_WIDTH,
    minHeight: config.WINDOW.MAIN.MIN_HEIGHT,
    autoHideMenuBar: !settings.restore('showMenu', true),
    icon: ICON_PATH,
    show: false,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      preload: PRELOAD_JS,
      webviewTag: true
    }
  });

  if (settings.restore('fullscreen', false)) {
    main.setFullScreen(true);
  } else {
    main.setBounds(settings.restore('bounds', main.getBounds()));
  }

  let baseURL = BASE_URL;
  baseURL += (baseURL.includes('?') ? '&' : '?') + 'hl=' + locale.getCurrent();
  main.loadURL(`file://${__dirname}/renderer/index.html?env=${encodeURIComponent(baseURL)}`);

  if (argv.devtools) {
    main.webContents.openDevTools();
  }

  if (!argv.startup && !argv.hidden) {
    if (!util.isInView(main)) {
      main.center();
    }

    discloseWindowID(main);
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
  if (about === undefined) {
    about = new BrowserWindow({
      title: config.NAME,
      width: config.WINDOW.ABOUT.WIDTH,
      height: config.WINDOW.ABOUT.HEIGHT,
      resizable: false,
      fullscreen: false
    });
    about.setMenuBarVisibility(false);
    about.loadURL(ABOUT_HTML);
    about.webContents.on('dom-ready', () => {
      about.webContents.send('about-loaded', {
        webappVersion: webappVersion
      });
    });

    about.on('closed', () => {
      about = undefined;
    });
  }
  about.show();
};

const discloseWindowID = browserWindow => {
  windowManager.setPrimaryWindowId(browserWindow.id);
};

///////////////////////////////////////////////////////////////////////////////
// APP Events
///////////////////////////////////////////////////////////////////////////////
app.on('window-all-closed', event => {
  event.preventDefault();
  if (!environment.isMacOS) {
    app.quit();
  }
});

app.on('activate', () => {
  if (main) {
    main.show();
  }
});

app.on('before-quit', () => (quitting = true));

app.on('quit', async () => await settings.persistToFile());

///////////////////////////////////////////////////////////////////////////////
// System Menu & Tray Icon & Show window
///////////////////////////////////////////////////////////////////////////////
app.on('ready', () => {
  const appMenu = systemMenu.createMenu();
  if (environment.app.IS_DEVELOPMENT) {
    appMenu.append(developerMenu);
  }
  appMenu.on('about-wire', () => {
    showAboutWindow();
  });

  Menu.setApplicationMenu(appMenu);
  tray.createTrayIcon();
  showMainWindow();

  const shortcut = globalShortcut.register('CommandOrControl+0', () => {
    main.show();
  });

  if (!shortcut) {
    console.log('Registration failed.');
  }

  main.on('close', event => {
    event.preventDefault();
    main.hide();
  });
});

///////////////////////////////////////////////////////////////////////////////
// Rename "console.log" to "console.old" (for every log directory of every account)
///////////////////////////////////////////////////////////////////////////////
fs.readdir(LOG_DIR, (error, contents) => {
  if (error) return console.log(`Failed to read log directory with error: ${error.message}`);

  contents
    .map(file => path.join(LOG_DIR, file, config.LOG_FILE_NAME))
    .filter(file => {
      try {
        return fs.statSync(file).isFile();
      } catch (error) {
        return undefined;
      }
    })
    .forEach(file => {
      if (file.endsWith('.log')) {
        fs.renameSync(file, file.replace('.log', '.old'));
      }
    });
});

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

    app.on('web-contents-created', (event, contents) => {
      switch (contents.getType()) {
        case 'window':
          contents.on('will-attach-webview', (e, webPreferences, params) => {
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
              e.preventDefault();
              webviewProtectionDebug('Prevented to show an unauthorized <webview>. URL: %s', _url);
            }
          });
          break;

        case 'webview':
          // Open webview links outside of the app
          contents.on('new-window', (e, _url) => {
            openLinkInNewWindow(e, _url);
          });
          contents.on('will-navigate', (e, _url) => {
            willNavigateInWebview(e, _url);
          });

          contents.session.setCertificateVerifyProc((request, cb) => {
            const { hostname = '', certificate = {}, error } = request;

            if (typeof error !== 'undefined') {
              console.error('setCertificateVerifyProc', error);
              main.loadURL(CERT_ERR_HTML);
              return cb(-2);
            }

            if (certutils.hostnameShouldBePinned(hostname)) {
              const pinningResults = certutils.verifyPinning(hostname, certificate);
              for (const result of Object.values(pinningResults)) {
                if (result === false) {
                  console.error(`Certutils verification failed for ${hostname}: ${result} is false`);
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

class BrowserWindowInit {
  constructor() {
    this.debug = debug('BrowserWindowInit');
    this.quitting = false;
    this.accessToken = false;

    // Start the browser window
    this.browserWindow = new BrowserWindow({
      title: config.NAME,
      titleBarStyle: 'hidden-inset',

      width: config.WINDOW.MAIN.DEFAULT_WIDTH,
      height: config.WINDOW.MAIN.DEFAULT_HEIGHT,
      minWidth: config.WINDOW.MAIN.MIN_WIDTH,
      minHeight: config.WINDOW.MAIN.MIN_HEIGHT,

      autoHideMenuBar: !settings.restore('showMenu', true),
      icon: ICON_PATH,
      show: false,
      backgroundColor: '#fff',

      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: false,
        preload: PRELOAD_JS,
        webviewTag: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: true,
        webgl: false
      }
    });

    // Show the renderer
    const envUrl = encodeURIComponent(`${BASE_URL}${BASE_URL.includes('?') ? '&' : '?'}hl=${locale.getCurrent()}`);
    main.loadURL(`file://${path.join(APP_PATH, 'renderer', 'index.html')}?env=${envUrl}`);

    // Restore previous window size
    if (settings.restore('fullscreen', false)) {
      this.browserWindow.setFullScreen(true);
    } else {
      this.browserWindow.setBounds(settings.restore('bounds', this.browserWindow.getBounds()));
    }
  }
}

new ElectronWrapperInit().run();

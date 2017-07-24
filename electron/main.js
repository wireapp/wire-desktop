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
const {app, BrowserWindow, ipcMain, Menu, shell} = require('electron');
const fs = require('fs');
const minimist = require('minimist');
const path = require('path');
const raygun = require('raygun');
const rimraf = require('rimraf');
/*eslint-disable no-unused-vars*/
const debug = require('debug');
const debugMain = debug('mainTmp');
/*eslint-enable no-unused-vars*/

// Paths
const APP_PATH = app.getAppPath();
/*eslint-disable no-unused-vars*/
const USER_DATAS_PATH = app.getPath('userData');
/*eslint-enable no-unused-vars*/

// Local files defines
const PRELOAD_JS = path.join(APP_PATH, 'js', 'preload.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css', 'wrapper.css');
const CERT_ERR_HTML = `file://${path.join(APP_PATH, 'html', 'certificate-error.html')}`;
const ABOUT_HTML = `file://${path.join(APP_PATH, 'html', 'about.html')}`;

// Configuration persistence
const settings = require('./js/lib/settings');

// Wrapper modules
const certutils = require('./js/certutils');
const download = require('./js/lib/download');
const googleAuth = require('./js/lib/googleAuth');
const locale = require('./locale/locale');
const systemMenu = require('./js/menu/system');
const developerMenu = require('./js/menu/developer');
const tray = require('./js/menu/tray');
const util = require('./js/util');
const windowManager = require('./js/window-manager');

// Config
const argv = minimist(process.argv.slice(1));
const config = require('./js/config');

// Icon
const ICON = `wire.${((process.platform === 'win32') ? 'ico' : 'png')}`;
const ICON_PATH = path.join(APP_PATH, 'img', ICON);

const BASE_URL = (() => {
  if (!argv.env && config.DEVELOPMENT) {
    switch (settings.restore('env', config.INTERNAL)) {
      case config.DEV: return config.DEV_URL;
      case config.EDGE: return config.EDGE_URL;
      case config.INTERNAL: return config.INTERNAL_URL;
      case config.LOCALHOST: return config.LOCALHOST_URL;
      case config.STAGING: return config.STAGING_URL;
    }
  }

  return argv.env || config.PROD_URL;
})();


let main;
let raygunClient;
let about;
let quitting = false;
let shouldQuit = false;
let webappVersion;

///////////////////////////////////////////////////////////////////////////////
// Misc
///////////////////////////////////////////////////////////////////////////////
raygunClient = new raygun.Client().init({apiKey: config.RAYGUN_API_KEY});

raygunClient.onBeforeSend(payload => {
  delete payload.details.machineName;
  return payload;
});

if (config.DEVELOPMENT) {
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
if (process.platform !== 'darwin') {
  shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
    if (main) {
      windowManager.showPrimaryWindow();
    }
    return true;
  });
  if (process.platform !== 'win32' && shouldQuit) {
    // Using exit instead of quit for the time being
    // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
    app.exit();
  }
}

///////////////////////////////////////////////////////////////////////////////
// Auto Update
///////////////////////////////////////////////////////////////////////////////
if (process.platform === 'win32') {
  const squirrel = require('./js/squirrel');
  squirrel.handleSquirrelEvent(shouldQuit);

  ipcMain.on('wrapper-restart', () => {
    squirrel.installUpdate();
  });

  // Stop further execution on update to prevent second tray icon
  if (shouldQuit) {
    return;
  }
}

///////////////////////////////////////////////////////////////////////////////
// Fix indicator icon on Unity
// Source: https://bugs.launchpad.net/ubuntu/+bug/1559249
///////////////////////////////////////////////////////////////////////////////
if (process.platform === 'linux') {
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
  googleAuth.getAccessToken(config.GOOGLE_SCOPES, config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET)
    .then(code => {
      event.sender.send('google-auth-success', code.access_token);
    })
    .catch(error => {
      event.sender.send('google-auth-error', error);
    });
});

ipcMain.on('delete-account-data', (e, accountID, sessionID) => {

  // delete webview partition
  try {
    if (sessionID) {
      const partitionDir = path.join(app.getPath('userData'), 'Partitions', sessionID);
      rimraf.sync(partitionDir);
      debugMain(`Deleted partition for account: ${sessionID}`);
    } else {
      debugMain(`Skipping partition deletion for account: ${accountID}`);
    }
  } catch (error) {
    debugMain(`Failed to partition for account: ${sessionID}`);
  }

  // delete logs
  try {
    const logDir = path.join(app.getPath('userData'), 'logs', accountID);
    rimraf.sync(logDir);
    debugMain(`Deleted logs folder for account: ${accountID}`);
  } catch (error) {
    debugMain(`Failed to delete logs folder for account: ${accountID} with error: ${error.message}`);
  }
});

ipcMain.on('wrapper-reload', () => {
  app.relaunch();
  // Using exit instead of quit for the time being
  // see: https://github.com/electron/electron/issues/8862#issuecomment-294303518
  app.exit();
});

///////////////////////////////////////////////////////////////////////////////
// APP Windows
///////////////////////////////////////////////////////////////////////////////
function showMainWindow() {
  main = new BrowserWindow({
    title: config.NAME,
    titleBarStyle: 'hidden-inset',
    width: config.DEFAULT_WIDTH_MAIN,
    height: config.DEFAULT_HEIGHT_MAIN,
    minWidth: config.MIN_WIDTH_MAIN,
    minHeight: config.MIN_HEIGHT_MAIN,
    autoHideMenuBar: !settings.restore('showMenu', true),
    icon: ICON_PATH,
    show: false,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      preload: PRELOAD_JS,

      // Enable <webview>
      webviewTag: true,
    },
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
    setTimeout(function() {
      main.show();
    }, 800);
  }

  main.webContents.on('will-navigate', function(event, url) {
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

  main.on('page-title-updated', function() {
    tray.updateBadgeIcon(main);
  });
  
  main.on('close', async (event) => {
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
      return;
    }
    
    debugMain('Persisting user configuration file...');
    await settings._saveToFile();
  });

  main.webContents.on('crashed', () => {
    main.reload();
  });
}

function showAboutWindow() {
  if (about === undefined) {
    about = new BrowserWindow({
      title: config.NAME,
      width: 304,
      height: 256,
      resizable: false,
      fullscreen: false,
    });
    about.setMenuBarVisibility(false);
    about.loadURL(ABOUT_HTML);
    about.webContents.on('dom-ready', function() {
      about.webContents.send('about-loaded', {
        webappVersion: webappVersion,
      });
    });

    about.on('closed', function() {
      about = undefined;
    });
  }
  about.show();
}

function discloseWindowID(browserWindow) {
  windowManager.setPrimaryWindowId(browserWindow.id);
};

///////////////////////////////////////////////////////////////////////////////
// APP Events
///////////////////////////////////////////////////////////////////////////////
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  if (main) {
    main.show();
  }
});

app.on('before-quit', function() {
  quitting = true;
});

///////////////////////////////////////////////////////////////////////////////
// System Menu & Tray Icon & Show window
///////////////////////////////////////////////////////////////////////////////
app.on('ready', function() {
  let appMenu = systemMenu.createMenu();
  if (config.DEVELOPMENT) {
    appMenu.append(developerMenu);
  }
  appMenu.on('about-wire', function() {
    showAboutWindow();
  });

  Menu.setApplicationMenu(appMenu);
  tray.createTrayIcon();
  showMainWindow();
});

///////////////////////////////////////////////////////////////////////////////
// Delete the console.log
///////////////////////////////////////////////////////////////////////////////
const logDir = path.join(app.getPath('userData'), 'logs');
fs.readdir(logDir, (error, files) => {
  if (error) {
    console.log(`Failed to read log directory with error: ${error.message}`);
    return;
  }

  // TODO filter out dotfiles
  for (const file of files) {
    const consoleLog = path.join(logDir, file, config.CONSOLE_LOG);
    fs.rename(consoleLog, consoleLog.replace('.log', '.old'), (renameError) => {
      if (renameError) {
        console.log(`Failed to rename log file (${consoleLog}) with error: ${renameError.message}`);
      }
    });
  }
  
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

      switch(contents.getType()) {
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
          contents.on('new-window', (e, _url) => { openLinkInNewWindow(e, _url); });
          contents.on('will-navigate', (e, _url) => { willNavigateInWebview(e, _url); });

          contents.session.setCertificateVerifyProc((request, cb) => {
            const {hostname = '', certificate = {}, error} = request;

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
};

class BrowserWindowInit {

  constructor() {

    this.debug = debug('BrowserWindowInit');
    this.quitting = false;
    this.accessToken = false;

    // Start the browser window
    this.browserWindow = new BrowserWindow({
      title: config.NAME,
      titleBarStyle: 'hidden-inset',

      width: config.DEFAULT_WIDTH_MAIN,
      height: config.DEFAULT_HEIGHT_MAIN,
      minWidth: config.MIN_WIDTH_MAIN,
      minHeight: config.MIN_HEIGHT_MAIN,

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
        webgl: false,
      },
    });

    // Show the renderer
    const envUrl = encodeURIComponent(`${BASE_URL}${(BASE_URL.includes('?') ? '&' : '?')}hl=${locale.getCurrent()}`);
    main.loadURL(`file://${path.join(APP_PATH, 'renderer', 'index.html')}?env=${envUrl}`);

    // Restore previous window size
    if (settings.restore('fullscreen', false)) {
      this.browserWindow.setFullScreen(true);
    } else {
      this.browserWindow.setBounds(settings.restore('bounds', this.browserWindow.getBounds()));
    }
  }
};

(new ElectronWrapperInit()).run();

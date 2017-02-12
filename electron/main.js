/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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

'use strict';

const {app, BrowserWindow, ipcMain, Menu, shell} = require('electron');

const fs = require('fs');
const minimist = require('minimist');
const path = require('path');
const raygun = require('raygun');

const config = require('./js/config');
const download = require('./js/lib/download');
const googleAuth = require('./js/lib/googleAuth');
const init = require('./js/lib/init');
const locale = require('./locale/locale');
const systemMenu = require('./js/menu/system');
const developerMenu = require('./js/menu/developer');
const tray = require('./js/menu/tray');
const util = require('./js/util');

const APP_PATH = app.getAppPath();
const PRELOAD_JS = path.join(APP_PATH, 'js', 'preload.js');
const WRAPPER_CSS = path.join(APP_PATH, 'css', 'wrapper.css');
const SPLASH_HTML = 'file://' + path.join(APP_PATH, 'html', 'splash.html');
const ABOUT_HTML = 'file://' + path.join(APP_PATH, 'html', 'about.html');
const ICON = 'wire.' + ((process.platform === 'win32') ? 'ico' : 'png');
const ICON_PATH = path.join(APP_PATH, 'img', ICON);

let main;
let raygunClient;
let about;
let enteredWebapp = false;
let quitting = false;
let shouldQuit = false;
let argv = minimist(process.argv.slice(1));

///////////////////////////////////////////////////////////////////////////////
// Misc
///////////////////////////////////////////////////////////////////////////////
raygunClient = new raygun.Client().init({apiKey: config.RAYGUN_API_KEY});

raygunClient.onBeforeSend(function(payload) {
  delete payload.details.machineName;
  return payload;
});

if (config.DEVELOPMENT) {
  app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
}

if (argv.portable) {
  const USER_PATH = path.join(APP_PATH, '..', 'WireData');
  app.setPath('userData', USER_PATH);
}

///////////////////////////////////////////////////////////////////////////////
// Single Instance stuff
///////////////////////////////////////////////////////////////////////////////
// makeSingleInstance will crash the signed mas app
// see: https://github.com/atom/electron/issues/4688
if (process.platform !== 'darwin') {
  shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    if (main) {
      if (!main.isVisible()) {
        main.show();
      }
      main.focus();
    }
    return true;
  });
  if (process.platform === 'linux' && shouldQuit) {
    app.quit();
  }
}


///////////////////////////////////////////////////////////////////////////////
// IPC events
///////////////////////////////////////////////////////////////////////////////
function getBaseUrl() {
  let baseURL = argv.env || config.PROD_URL;
  if (!argv.env && config.DEVELOPMENT) {
    let env = init.restore('env', config.INTERNAL);

    if (env === config.CRYPTO) baseURL = config.BENNY_URL;
    if (env === config.DEV) baseURL = config.DEV_URL;
    if (env === config.EDGE) baseURL = config.EDGE_URL;
    if (env === config.INTERNAL) baseURL = config.INTERNAL_URL;
    if (env === config.LOCALHOST) baseURL = config.LOCALHOST_URL;
    if (env === config.PROD) baseURL = config.PROD_URL;
    if (env === config.STAGING) baseURL = config.STAGING_URL;
  }
  return baseURL;
}

ipcMain.once('load-webapp', function(event, online) {
  enteredWebapp = true;
  let baseURL = getBaseUrl();
  baseURL += (baseURL.includes('?') ? '&' : '?') + 'hl=' + locale.getCurrent();
  main.loadURL(baseURL);
});

ipcMain.on('loaded', function() {
  let size = main.getSize();
  if (size[0] < config.MIN_WIDTH_MAIN || size[1] < config.MIN_HEIGHT_MAIN) {
    util.resizeToBig(main);
  }
});

ipcMain.on('save-picture', function(event, fileName, bytes) {
  download(fileName, bytes);
});

ipcMain.on('notification-click', function() {
  main.show();
});

ipcMain.on('google-auth-request', function(event) {
  googleAuth.getAccessToken(config.GOOGLE_SCOPES, config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET)
    .then(function(code) {
      event.sender.send('google-auth-success', code.access_token);
    })
    .catch(function(error) {
      event.sender.send('google-auth-error', error);
    });
});

ipcMain.on('wrapper-reload', function() {
  app.quit();
  app.relaunch();
});

///////////////////////////////////////////////////////////////////////////////
// APP Windows
///////////////////////////////////////////////////////////////////////////////
function showMainWindow() {
  main = new BrowserWindow({
    'title': config.NAME,
    'titleBarStyle': 'hidden-inset',
    'width': config.DEFAULT_WIDTH_MAIN,
    'height': config.DEFAULT_HEIGHT_MAIN,
    'minWidth': config.MIN_WIDTH_MAIN,
    'minHeight': config.MIN_HEIGHT_MAIN,
    'autoHideMenuBar': false,
    'icon': ICON_PATH,
    'show': false,
    'webPreferences': {
      'backgroundThrottling': false,
      'nodeIntegration': false,
      'preload': PRELOAD_JS,
    },
  });

  if (init.restore('fullscreen', false)) {
    main.setFullScreen(true);
  } else {
    main.setBounds(init.restore('bounds', main.getBounds()));
  }

  main.loadURL(SPLASH_HTML);

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
    // Prevent links like www.wire.com without blank target:
    // to be opened inside the wrapper
    if (util.openInExternalWindow(url)) {
      event.preventDefault();
      shell.openExternal(url);
      return;
    }

    // Prevent Redirect for Drag and Drop on embeds
    // or when no internet is present
    if (url.includes('file://')) {
      event.preventDefault();
    }

    // Resize the window for auth
    if (url.includes('/auth/')) {
      util.resizeToSmall(main);
    }
  });

  main.webContents.on('new-window', function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  main.webContents.on('dom-ready', function() {
    main.webContents.insertCSS(fs.readFileSync(WRAPPER_CSS, 'utf8'));
    if (enteredWebapp) {
      main.webContents.send('webapp-loaded', {
        electron_version: app.getVersion(),
        notification_icon: path.join(app.getAppPath(), 'img', 'notification.png'),
      });
    } else {
      main.webContents.send('splash-screen-loaded');
    }
  });

  main.on('focus', function() {
    main.flashFrame(false);
  });

  main.on('page-title-updated', function() {
    tray.updateBadgeIcon(main);
  });

  main.on('close', function(event) {
    init.save('fullscreen', main.isFullScreen());
    if (!main.isFullScreen()) {
      init.save('bounds', main.getBounds());
    }

    if (!quitting) {
      event.preventDefault();
      main.hide();
    }
  });

  main.webContents.on('crashed', function() {
    main.reload();
  });
}

function showAboutWindow() {
  if (about === undefined) {
    about = new BrowserWindow({
      'title': '',
      'width': 304,
      'height': 208,
      'resizable': false,
      'fullscreen': false,
    });
    about.setMenuBarVisibility(false);
    about.loadURL(ABOUT_HTML);
    about.on('closed', function() {
      about = undefined;
    });
  }
  about.show();
}

function discloseWindowID(browserWindow) {
  const windowManager = require('./js/window-manager');
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
let consoleLog = path.join(app.getPath('userData'), config.CONSOLE_LOG);
fs.stat(consoleLog, function(err, stats) {
  if (!err) {
    fs.rename(consoleLog, consoleLog.replace('.log', '.old'));
  }
});


///////////////////////////////////////////////////////////////////////////////
// Auto Update
///////////////////////////////////////////////////////////////////////////////
if (process.platform === 'win32') {
  const squirrel = require('./js/squirrel');
  squirrel.handleSquirrelEvent(shouldQuit);

  ipcMain.on('wrapper-restart', function() {
    squirrel.installUpdate();
  });
}

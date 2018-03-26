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
const pako = require('pako');
const path = require('path');
const raygun = require('raygun');
const {BrowserWindow, Menu, app, ipcMain, session, shell} = require('electron');

// Paths
const APP_PATH = app.getAppPath();

// Local files defines
const ABOUT_HTML = fileUrl(path.join(APP_PATH, 'html', 'about.html'));
const ABOUT_WINDOW_WHITELIST = [ABOUT_HTML,
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
const pkg = require('./package.json');

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
  const isPopOS = process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('pop');
  const isGnome = process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('GNOME');
  if (isUbuntuUnity || isPopOS || isGnome) {
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

// Export / import
ipcMain.on('export-table', async (event, tableName, data) => {
  const tempFile = path.resolve('backup', '.temp', tableName);

  try {
    const fileStats = await fs.stat(tempFile);

    if (fileStats.isFile()) {
      try {
        await fs.appendFile(tempFile, data);
        return;
      } catch(error) {
        debugMain(`Failed to append data to file "${tableName}" with error: ${error.message}`);
        console.error(`Failed to append data to file: "${tableName}" with error: ${error.message}`);
        event.sender.send('export-error', error)
        return;
      }
    }
  } catch(error) {

  }

  try {
    await fs.outputFile(tempFile, data);
  } catch(error) {
    debugMain(`Failed to save data to file "${tableName}" with error: ${error.message}`);
    console.error(`Failed to save data to file: "${tableName}" with error: ${error.message}`);
    event.sender.send('export-error', error)
    return;
  }
});

ipcMain.on('export-zip', async event => {
  const now = new Date();
  const backupPath = path.resolve('backup');
  const tempPath = path.resolve(backupPath, '.temp');
  const metadataFile = path.resolve(tempPath, 'metadata.json');
  let files;
  let zipped;

  const getTimestamp = () => {
    const pad = obj => ('0' + obj).slice(-2);
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hour = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    return `${year}-${month}-${day}_${hour}-${minutes}-${seconds}`;
  };

  // TODO
  const metadata = {
    platform: 'Web',
    version: webappVersion,
    user: '',
    creation_time: now.toISOString(),
    client_id: '',
  };

  try {
    await fs.outputFile(metadataFile, metadata);
  } catch(error) {
    debugMain(`Failed to save metadata to file "${metadataFile}" with error: ${error.message}`);
    console.error(`Failed to save metadata to file: "${metadataFile}" with error: ${error.message}`);
    event.sender.send('export-error', error)
    return;
  }

  try {
    files = await fs.readdir(tempPath);
  } catch(error) {
    debugMain(`Failed to read directory "${tempPath}" with error: "${error.message}"`);
    console.error(`Failed to read directory "${tempPath}" with error: "${error.message}"`);
    event.sender.send('export-error', error);
    return;
  }

  if (!files.length) {
    const errorMessage = `No files to zip from "${tempPath}": Directory empty.`;
    debugMain(errorMessage);
    console.error(errorMessage);
    event.sender.send('export-error', errorMessage);
    return;
  }

  const blob = await Promise.all(files.map(async filename => {
    const resolvedFilename = path.resolve(tempPath, filename);
    let content;

    try {
      content = await fs.readFile(resolvedFilename, 'utf8');
    } catch(error) {
      debugMain(`Failed to read file "${resolvedFilename}" with error: "${error.message}"`);
      console.error(`Failed to read file "${resolvedFilename}" with error: "${error.message}"`);
      event.sender.send('export-error', error);
    }
    return `{"${filename}":${content}}`;
  }));

  const data = blob.join('\n');

  try {
    zipped = pako.gzip(data);
  } catch(error) {
    debugMain(`Failed to gzip data: ${data} with error: "${error.message}"`);
    console.error(`Failed to gzip data: ${data} with error: "${error.message}"`);
    event.sender.send('export-error', error)
    return;
  }

  const zipFilename = path.resolve(backupPath, `backup-${getTimestamp()}.dat`);

  try {
    await fs.outputFile(zipFilename, zipped);
  } catch(error) {
    debugMain(`Failed to save data to file "${zipFilename}" with error: "${error.message}"`);
    console.error(`Failed to save data to file: "${zipFilename}" with error: "${error.message}"`);
    event.sender.send('export-error', error)
    return;
  }

  try {
    await fs.remove(tempPath);
  } catch(error) {
    debugMain(`Failed to remove directory "${tempPath}" with error: ${error.message}`);
    console.error(`Failed to remove directory "${tempPath}" with error: ${error.message}`);
    event.sender.send('export-error', error)
  }

  event.sender.send('export-done', zipFilename);
});

ipcMain.on('import-from-zip', async (event, filename) => {
  const resolvedFilename = path.resolve('backup', filename);
  let compressed;
  let unzipped;

  try {
    const buffer = await fs.readFile(resolvedFilename);
    compressed = new Uint8Array(buffer);
  } catch(error) {
    debugMain(`Failed to read data from file "${resolvedFilename}" with error: "${error.message}"`);
    console.error(`Failed to read data from file: "${resolvedFilename}" with error: "${error.message}"`);
    event.sender.send('import-error', error)
    return;
  }

  try {
    unzipped = pako.ungzip(compressed, { to: 'string' });
  } catch(error) {
    debugMain(`Failed to ungzip data from file "${resolvedFilename}" with error: "${error.message}"`);
    console.error(`Failed to ungzip data from file "${resolvedFilename}" with error: "${error.message}"`);
    event.sender.send('import-error', error)
    return;
  }

  const tables = unzipped.split('\n');
  console.log('imported tables', tables);
  tables.forEach(tableData => event.sender.send('import-data', tableData));
});

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
    titleBarStyle: 'hiddenInset',
    width: config.WINDOW.MAIN.DEFAULT_WIDTH,
    height: config.WINDOW.MAIN.DEFAULT_HEIGHT,
    minWidth: config.WINDOW.MAIN.MIN_WIDTH,
    minHeight: config.WINDOW.MAIN.MIN_HEIGHT,
    autoHideMenuBar: !settings.restore('showMenu', true),
    backgroundColor: '#f7f8fa',
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
    about.webContents.session.webRequest.onBeforeRequest({
      urls: ['*'],
    }, (details, callback) => {
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
    });

    // Locales
    ipcMain.on('about-locale-values', (event, labels) => {
      if (event.sender.id !== about.webContents.id) {
        return;
      }
      const resultLabels = {};
      for (const label of labels) {
        resultLabels[label] = locale.getText(label);
      }
      event.sender.send('about-locale-render', resultLabels);
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
      about.webContents.send('about-loaded', {
        webappVersion: webappVersion,
        productName: pkg.productName,
        electronVersion: pkg.version,
      });
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
                  console.error(`Certutils verification failed for "${hostname}":\n${pinningResults.errorMessage}`);
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

new ElectronWrapperInit().run();

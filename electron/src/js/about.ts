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

import {BrowserWindow, IpcMessageEvent, app, ipcMain, session, shell} from 'electron';
import fileUrl = require('file-url');
import * as path from 'path';

import {i18nStringIdentifier} from '../interfaces';
import * as locale from '../locale/locale';
import * as config from './config';
import {EVENT_TYPE} from './lib/eventType';

const pkg = require('../../package.json');

let aboutWindow: BrowserWindow | undefined;
let webappVersion: string;

// Paths
const APP_PATH = app.getAppPath();

// Local files
const ABOUT_HTML = fileUrl(path.join(APP_PATH, 'html', 'about.html'));
const ABOUT_WINDOW_WHITELIST = [
  ABOUT_HTML,
  fileUrl(path.join(APP_PATH, 'img', 'wire.256.png')),
  fileUrl(path.join(APP_PATH, 'css', 'about.css')),
];
const PRELOAD_JS = path.join(APP_PATH, 'dist', 'js', 'preload-about.js');

ipcMain.once(EVENT_TYPE.UI.WEBAPP_VERSION, (event: IpcMessageEvent, version: string) => (webappVersion = version));

const showWindow = () => {
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      alwaysOnTop: true,
      backgroundColor: '#ececec',
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
        preload: PRELOAD_JS,
        session: session.fromPartition('about-window'),
        webviewTag: false,
      },
      width: config.WINDOW.ABOUT.WIDTH,
    });
    aboutWindow.setMenuBarVisibility(false);

    // Prevent any kind of navigation
    // will-navigate is broken with sandboxed env, intercepting requests instead
    // see https://github.com/electron/electron/issues/8841
    aboutWindow.webContents.session.webRequest.onBeforeRequest(
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
    ipcMain.on(EVENT_TYPE.ABOUT.LOCALE_VALUES, (event: IpcMessageEvent, labels: i18nStringIdentifier[]) => {
      if (aboutWindow) {
        const isExpected = event.sender.id === aboutWindow.webContents.id;
        if (isExpected) {
          const resultLabels: {[index: string]: string} = {};
          labels.forEach(label => (resultLabels[label] = locale.getText(label)));
          event.sender.send(EVENT_TYPE.ABOUT.LOCALE_RENDER, resultLabels);
        }
      }
    });

    // Close window via escape
    aboutWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'Escape') {
        if (aboutWindow) {
          aboutWindow.close();
        }
      }
    });

    aboutWindow.on('closed', () => (aboutWindow = undefined));

    aboutWindow.loadURL(ABOUT_HTML);

    aboutWindow.webContents.on('dom-ready', () => {
      if (aboutWindow) {
        aboutWindow.webContents.send(EVENT_TYPE.ABOUT.LOADED, {
          electronVersion: pkg.version,
          productName: pkg.productName,
          webappVersion: webappVersion,
        });
      }
    });
  }

  aboutWindow.show();
};

export {showWindow};

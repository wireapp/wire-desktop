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

import {app, BrowserWindow, ipcMain, session} from 'electron';
import fileUrl = require('file-url');
import * as path from 'path';

import {EVENT_TYPE} from '../lib/eventType';
import * as locale from '../locale/locale';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import {config} from '../settings/config';
import {getLogger} from '../logging/getLogger';
import * as WindowUtil from '../window/WindowUtil';

const logger = getLogger(path.basename(__filename));

let webappVersion: string;

// Paths
const APP_PATH = path.join(app.getAppPath(), config.electronDirectory);
const iconFileName = `logo.${EnvironmentUtil.platform.IS_WINDOWS ? 'ico' : 'png'}`;
const iconPath = path.join(APP_PATH, 'img', iconFileName);

// Local files
const ABOUT_HTML = fileUrl(path.join(APP_PATH, 'html/about.html'));
const ABOUT_WINDOW_ALLOWLIST = [
  ABOUT_HTML,
  fileUrl(path.join(APP_PATH, 'img/logo.256.png')),
  fileUrl(path.join(APP_PATH, 'css/about.css')),
];
const PRELOAD_JS = path.join(APP_PATH, 'dist/renderer/menu/preload-about.js');

const WINDOW_SIZE = {
  HEIGHT: 256,
  WIDTH: 304,
};

ipcMain.once(EVENT_TYPE.UI.WEBAPP_VERSION, (_event, version: string) => (webappVersion = version));

const showWindow = async () => {
  let aboutWindow: BrowserWindow | undefined;

  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      alwaysOnTop: true,
      backgroundColor: '#ececec',
      fullscreen: false,
      height: WINDOW_SIZE.HEIGHT,
      icon: iconPath,
      maximizable: false,
      minimizable: false,
      resizable: false,
      show: false,
      title: config.name,
      webPreferences: {
        enableBlinkFeatures: '',
        javascript: false,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        preload: PRELOAD_JS,
        session: session.fromPartition('about-window'),
        spellcheck: false,
        webviewTag: false,
      },
      width: WINDOW_SIZE.WIDTH,
    });
    aboutWindow.setMenuBarVisibility(false);

    // Prevent any kind of navigation
    // will-navigate is broken with sandboxed env, intercepting requests instead
    // see https://github.com/electron/electron/issues/8841
    aboutWindow.webContents.session.webRequest.onBeforeRequest(async ({url}, callback) => {
      // Only allow those URLs to be opened within the window
      if (ABOUT_WINDOW_ALLOWLIST.includes(url)) {
        return callback({cancel: false});
      }
    });

    // Handle the new window event in the About Window
    aboutWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault();

      // Ensure the link does not come from a webview
      if (typeof (event as any).sender.viewInstanceId !== 'undefined') {
        logger.log('New window was created from a webview, aborting.');
        return;
      }

      return WindowUtil.openExternal(url, true);
    });

    // Locales
    ipcMain.on(EVENT_TYPE.ABOUT.LOCALE_VALUES, (event, labels: locale.i18nLanguageIdentifier[]) => {
      if (aboutWindow) {
        const isExpected = event.sender.id === aboutWindow.webContents.id;
        if (isExpected) {
          const resultLabels: Record<string, string> = {};
          labels.forEach(label => (resultLabels[label] = locale.getText(label)));
          event.sender.send(EVENT_TYPE.ABOUT.LOCALE_RENDER, resultLabels);
        }
      }
    });

    // Close window via escape
    aboutWindow.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.key === 'Escape') {
        if (aboutWindow) {
          aboutWindow.close();
        }
      }
    });

    aboutWindow.on('closed', () => (aboutWindow = undefined));

    await aboutWindow.loadURL(ABOUT_HTML);

    if (aboutWindow) {
      aboutWindow.webContents.send(EVENT_TYPE.ABOUT.LOADED, {
        copyright: config.copyright,
        electronVersion: config.version,
        productName: config.name,
        webappVersion,
      });
    }
  }

  aboutWindow.show();
};

export const AboutWindow = {showWindow};

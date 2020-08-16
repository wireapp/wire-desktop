/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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
import {config} from '../settings/config';

const appPath = path.join(app.getAppPath(), config.electronDirectory);

const promptHtmlPath = fileUrl(path.join(appPath, 'html/proxy-prompt.html'));
const proxyPromptWindowAllowList = [promptHtmlPath, fileUrl(path.join(appPath, 'css/proxy-prompt.css'))];
const preloadPath = path.join(appPath, 'dist/renderer/menu/preload-proxy-prompt.js');

const windowSize = {
  HEIGHT: 350,
  WIDTH: 550,
};

const showWindow = async () => {
  let proxyPromptWindow: BrowserWindow | undefined;

  if (!proxyPromptWindow) {
    proxyPromptWindow = new BrowserWindow({
      alwaysOnTop: true,
      backgroundColor: '#ececec',
      fullscreen: false,
      height: windowSize.HEIGHT,
      maximizable: false,
      minimizable: false,
      resizable: false,
      show: false,
      title: config.name,
      webPreferences: {
        javascript: true,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        preload: preloadPath,
        session: session.fromPartition('proxy-prompt-window'),
        spellcheck: false,
        webviewTag: false,
      },
      width: windowSize.WIDTH,
    });
    proxyPromptWindow.setMenuBarVisibility(false);

    // Prevent any kind of navigation
    // will-navigate is broken with sandboxed env, intercepting requests instead
    // see https://github.com/electron/electron/issues/8841
    proxyPromptWindow.webContents.session.webRequest.onBeforeRequest(async ({url}, callback) => {
      // Only allow those URLs to be opened within the window
      if (proxyPromptWindowAllowList.includes(url)) {
        return callback({cancel: false});
      }

      callback({redirectURL: promptHtmlPath});
    });

    ipcMain.on(EVENT_TYPE.PROXY_PROMPT.LOCALE_VALUES, (event, labels: locale.i18nLanguageIdentifier[]) => {
      if (proxyPromptWindow) {
        const isExpected = event.sender.id === proxyPromptWindow.webContents.id;
        if (isExpected) {
          const resultLabels: Record<string, string> = {};
          labels.forEach(label => (resultLabels[label] = locale.getText(label)));
          event.reply(EVENT_TYPE.PROXY_PROMPT.LOCALE_RENDER, resultLabels);
        }
      }
    });

    proxyPromptWindow.on('closed', () => (proxyPromptWindow = undefined));

    await proxyPromptWindow.loadURL(promptHtmlPath);

    if (proxyPromptWindow) {
      proxyPromptWindow.webContents.send(EVENT_TYPE.PROXY_PROMPT.LOADED);
    }
  }

  proxyPromptWindow.show();
};

export const ProxyPromptWindow = {showWindow};

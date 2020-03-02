/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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
import {app, ipcMain, Event as ElectronEvent, WebContents} from 'electron';
import {getProxySettings} from 'get-proxy-settings';
import * as path from 'path';
import * as minimist from 'minimist';

import {MainRenderer} from './MainRenderer';
import {settings} from './settings/ConfigurationPersistence';
import {ProxyPromptWindow} from './window/ProxyPromptWindow';
import ProxyAuth from './auth/ProxyAuth';
import * as lifecycle from './runtime/lifecycle';
import * as EnvironmentUtil from './runtime/EnvironmentUtil';
import {getLogger} from './logging/getLogger';
import {WebviewHandler} from './WebviewHandler';
import {TrayHandler} from './menu/TrayHandler';
import {AboutWindow} from './window/AboutWindow';
import {WindowManager} from './window/WindowManager';
import {changeEnvironmentPrompt} from './lib/changeEnvironmentPrompt';
import {downloadImage} from './lib/download';
import {EVENT_TYPE} from './lib/eventType';
import {deleteAccount} from './lib/LocalAccountDeletion';
import * as systemMenu from './menu/system';

let isQuitting = false;
let triedProxy = false;

const argv = minimist(process.argv.slice(1));

const logger = getLogger(path.basename(__filename));
let mainRenderer: MainRenderer;
// This needs to stay global, see
// https://github.com/electron/electron/blob/v4.2.12/docs/faq.md#my-apps-windowtray-disappeared-after-a-few-minutes
let tray: TrayHandler;

export class ApplicationHandler {
  private authenticatedProxyInfo: URL | undefined;

  constructor() {
    if (argv['proxy-server-auth']) {
      try {
        this.authenticatedProxyInfo = new URL(argv['proxy-server-auth']);
        if (this.authenticatedProxyInfo.origin === 'null') {
          this.authenticatedProxyInfo = undefined;
          throw new Error('No protocol for the proxy server specified.');
        }
      } catch (error) {
        logger.error(`Could not parse authenticated proxy URL: "${error.message}"`);
      }
    }

    this.bindIpcEvents();
  }

  public run = () => {
    app.on('window-all-closed', () => {
      if (!EnvironmentUtil.platform.IS_MAC_OS) {
        lifecycle.quit();
      }
    });

    app.on('activate', () => {
      if (mainRenderer) {
        mainRenderer.show();
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

        if (this.authenticatedProxyInfo) {
          const {username, password} = this.authenticatedProxyInfo;
          logger.info('Sending provided credentials to authenticated proxy ...');
          await mainRenderer.applyProxySettings(this.authenticatedProxyInfo);
          return callback(username, password);
        }

        const systemProxy = await getProxySettings();
        const systemProxySettings = systemProxy && (systemProxy.http || systemProxy.https);
        if (systemProxySettings) {
          const {
            credentials: {username, password},
            protocol,
          } = systemProxySettings;
          this.authenticatedProxyInfo = ProxyAuth.generateProxyURL({host, port}, {password, protocol, username});
          logger.log('Applying proxy settings on the main window...');
          await mainRenderer.applyProxySettings(this.authenticatedProxyInfo);
          return callback(username, password);
        }

        if (!triedProxy) {
          ipcMain.once(
            EVENT_TYPE.PROXY_PROMPT.SUBMITTED,
            async (_event, promptData: {password: string; username: string}) => {
              logger.log('Proxy prompt was submitted');

              const {username, password} = promptData;
              const [originalProxyValue]: string[] = argv['proxy-server'] || argv['proxy-server-auth'];
              const protocol: string | undefined = /^[^:]+:\/\//.exec(originalProxyValue)?.toString();
              this.authenticatedProxyInfo = ProxyAuth.generateProxyURL(
                {host, port},
                {
                  ...promptData,
                  protocol,
                },
              );

              logger.log('Applying proxy settings on the main window...');
              await mainRenderer.applyProxySettings(this.authenticatedProxyInfo);
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

            mainRenderer.reload();
          });

          await ProxyPromptWindow.showWindow();
          triedProxy = true;
        }
      }
    });

    // System Menu, Tray Icon & Show window
    app.on('ready', async () => {
      tray = new TrayHandler();
      if (!EnvironmentUtil.platform.IS_MAC_OS) {
        tray.initTray();
      }
      mainRenderer = new MainRenderer(tray, () => isQuitting);
      await mainRenderer.create();
    });

    app.on('web-contents-created', async (_webviewEvent: ElectronEvent, contents: WebContents) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      WebviewHandler.handleNewWebview(contents, mainRenderer, this.authenticatedProxyInfo);
    });
  };

  private readonly bindIpcEvents = () => {
    ipcMain.on(EVENT_TYPE.ACTION.SAVE_PICTURE, (_event, bytes: Uint8Array, timestamp?: string) => {
      return downloadImage(bytes, timestamp);
    });

    ipcMain.on(EVENT_TYPE.ACTION.NOTIFICATION_CLICK, () => {
      WindowManager.showPrimaryWindow();
    });

    ipcMain.on(EVENT_TYPE.UI.BADGE_COUNT, (_event, count: number) => {
      tray.showUnreadCount(mainRenderer, count);
    });

    ipcMain.on(EVENT_TYPE.ACCOUNT.DELETE_DATA, async (_event, id: number, accountId: string, partitionId?: string) => {
      await deleteAccount(id, accountId, partitionId);
      mainRenderer.sendDataDeletedEvent();
    });
    ipcMain.on(EVENT_TYPE.WRAPPER.RELAUNCH, lifecycle.relaunch);
    ipcMain.on(EVENT_TYPE.ABOUT.SHOW, AboutWindow.showWindow);
    ipcMain.on(EVENT_TYPE.UI.TOGGLE_MENU, systemMenu.toggleMenuBar);
    ipcMain.on(EVENT_TYPE.ACTION.CHANGE_ENVIRONMENT, (event, environmentUrl: string) => {
      event.returnValue = changeEnvironmentPrompt(environmentUrl);
    });
  };
}

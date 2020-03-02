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

import {LogFactory} from '@wireapp/commons';
import {
  Event as ElectronEvent,
  BrowserWindowConstructorOptions,
  OnHeadersReceivedDetails as OnHeadersReceivedListenerDetails,
  OnHeadersReceivedFilter as Filter,
  OnHeadersReceivedResponse as HeadersReceivedResponse,
  WebContents,
  shell,
  app,
} from 'electron';
import {ipcMain} from 'electron';
import * as lifecycle from './runtime/lifecycle';
import * as EnvironmentUtil from './runtime/EnvironmentUtil';
import {ENABLE_LOGGING, getLogger} from './logging/getLogger';
import * as path from 'path';
import {config} from './settings/config';
import {EVENT_TYPE} from './lib/eventType';
import {OriginValidator} from './runtime/OriginValidator';
import {SingleSignOn} from './sso/SingleSignOn';
import {applyProxySettings} from './applyProxySettings';
import {setCertificateVerifyProc} from './lib/CertificateVerifyProcManager';
import {MainRenderer} from './MainRenderer';

const logger = getLogger(path.basename(__filename));

const APP_PATH = path.join(app.getAppPath(), config.electronDirectory);
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const PRELOAD_RENDERER_JS = path.join(APP_PATH, 'dist/renderer/preload-webview.js');

export class WebviewHandler {
  public static handleNewWebview = async (
    webContents: WebContents,
    mainRenderer: MainRenderer,
    authenticatedProxyInfo: any,
  ) => {
    if (authenticatedProxyInfo?.origin && webContents.session) {
      logger.log('Applying proxy settings on a webview...');
      await applyProxySettings(authenticatedProxyInfo, webContents);
    }

    switch (webContents.getType()) {
      case 'window': {
        webContents.on('will-attach-webview', (event, webPreferences, params) => {
          // Use secure defaults
          params.autosize = 'false';
          params.contextIsolation = 'true';
          params.plugins = 'false';
          webPreferences.allowRunningInsecureContent = false;
          webPreferences.nodeIntegration = false;
          webPreferences.preload = PRELOAD_RENDERER_JS;
          webPreferences.webSecurity = true;
          webPreferences.enableBlinkFeatures = '';
        });
        break;
      }
      case 'webview': {
        // Open webview links outside of the app
        webContents.on(
          'new-window',
          (
            event: ElectronEvent,
            url: string,
            frameName: string,
            _disposition: string,
            options: BrowserWindowConstructorOptions,
          ) => WebviewHandler.openLinkInNewWindow(event, url, frameName, _disposition, options, mainRenderer),
        );
        webContents.on('will-navigate', (event: ElectronEvent, url: string) => {
          WebviewHandler.willNavigateInWebview(event, url, webContents.getURL());
        });
        if (ENABLE_LOGGING) {
          webContents.on('console-message', async (_event, _level, message) => {
            const webViewId = lifecycle.getWebViewId(webContents);
            if (webViewId) {
              const logFilePath = path.join(LOG_DIR, webViewId, config.logFileName);
              try {
                await LogFactory.writeMessage(message, logFilePath);
              } catch (error) {
                logger.error(`Cannot write to log file "${logFilePath}": ${error.message}`, error);
              }
            }
          });
        }

        webContents.session.setCertificateVerifyProc(setCertificateVerifyProc);

        // Override remote Access-Control-Allow-Origin for localhost (CORS bypass)
        const isLocalhostEnvironment =
          EnvironmentUtil.getEnvironment() == EnvironmentUtil.BackendType.LOCALHOST.toUpperCase();
        if (isLocalhostEnvironment) {
          const filter: Filter = {
            urls: config.backendOrigins.map(value => `${value}/*`),
          };

          const listenerOnHeadersReceived = (
            details: OnHeadersReceivedListenerDetails,
            callback: (response: HeadersReceivedResponse) => void,
          ) => {
            const responseHeaders = {
              'Access-Control-Allow-Credentials': ['true'],
              'Access-Control-Allow-Origin': ['http://localhost:8081'],
            };

            callback({
              cancel: false,
              responseHeaders: {...details.responseHeaders, ...responseHeaders},
            });
          };

          webContents.session.webRequest.onHeadersReceived(filter, listenerOnHeadersReceived);
        }

        webContents.on('before-input-event', (_event, input) => {
          if (input.type === 'keyUp' && input.key === 'Alt') {
            ipcMain.emit(EVENT_TYPE.UI.TOGGLE_MENU);
          }
        });
        break;
      }
    }
  };

  private static readonly openLinkInNewWindow = (
    event: ElectronEvent,
    url: string,
    frameName: string,
    _disposition: string,
    options: BrowserWindowConstructorOptions,
    mainRenderer: MainRenderer,
  ) => {
    event.preventDefault();

    if (SingleSignOn.isSingleSignOnLoginWindow(frameName)) {
      return new SingleSignOn(mainRenderer['mainRenderer'], event, url, options).init();
    }

    logger.log(`Opening an external window from a webview.`);
    return shell.openExternal(url);
  };

  private static readonly willNavigateInWebview = (event: ElectronEvent, url: string, baseUrl: string) => {
    // Ensure navigation is to a whitelisted domain
    if (OriginValidator.isMatchingHost(url, baseUrl)) {
      logger.log(`Navigating inside webview. URL: ${url}`);
    } else {
      logger.log(`Preventing navigation inside <webview>. URL: ${url}`);
      event.preventDefault();
    }
  };
}

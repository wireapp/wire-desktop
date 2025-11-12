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

import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event as ElectronEvent,
  ProtocolRequest,
  Session,
  session,
  WebContents,
  HandlerDetails,
} from 'electron';

import * as crypto from 'crypto';
import * as path from 'path';
import {URL} from 'url';

import {LogFactory} from '@wireapp/commons';

import {executeJavaScriptWithoutResult} from '../lib/ElectronUtil';
import {ENABLE_LOGGING, getLogger} from '../logging/getLogger';
import {getWebViewId} from '../runtime/lifecycle';
import {config} from '../settings/config';
import * as WindowUtil from '../window/WindowUtil';

const minimist = require('minimist');

const argv = minimist(process.argv.slice(1));
const LOG_DIR = path.join(app.getPath('userData'), 'logs');

export class SingleSignOn {
  private static readonly ALLOWED_BACKEND_ORIGINS = config.backendOrigins;
  private static readonly SINGLE_SIGN_ON_FRAME_NAME = 'WIRE_SSO';
  private static readonly SSO_PROTOCOL = `${config.customProtocolName}-sso`;
  private static readonly SSO_PROTOCOL_HOST = 'response';
  private static readonly SSO_PROTOCOL_RESPONSE_SIZE_LIMIT = 255;
  private static readonly SSO_SESSION_NAME = 'sso';
  private static readonly MAX_LENGTH_ORIGIN_DOMAIN = 255;
  private static readonly MAX_LENGTH_ORIGIN = 'https://'.length + SingleSignOn.MAX_LENGTH_ORIGIN_DOMAIN;
  private static readonly logger = getLogger(path.basename(__filename));

  private static readonly RESPONSE_TYPES = {
    AUTH_ERROR_COOKIE: 'AUTH_ERROR_COOKIE',
    AUTH_ERROR_SESS_NOT_AVAILABLE: 'AUTH_ERROR_SESS_NOT_AVAILABLE',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
  };

  public static loginAuthorizationSecret: string | undefined;

  private session: Session | undefined;
  private ssoWindow: BrowserWindow | undefined;
  private readonly senderWebContents: WebContents;
  private readonly windowOptions: BrowserWindowConstructorOptions;
  private readonly windowOriginUrl: URL;
  public onClose = () => {};

  constructor(
    ssoWindow: BrowserWindow,
    senderEvent: ElectronEvent,
    windowOriginURL: string,
    windowOptions: BrowserWindowConstructorOptions,
  ) {
    this.windowOptions = windowOptions;
    this.ssoWindow = ssoWindow;
    this.senderWebContents = (senderEvent as any).sender;
    this.windowOriginUrl = new URL(windowOriginURL);
  }

  public readonly init = async (): Promise<SingleSignOn> => {
    // Create a ephemeral and isolated session
    this.session = session.fromPartition(SingleSignOn.SSO_SESSION_NAME, {cache: false});

    // Disable browser permissions (microphone, camera...)
    this.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

    // User-agent normalization
    this.session.webRequest.onBeforeSendHeaders(({requestHeaders}: any, callback) => {
      requestHeaders['User-Agent'] = config.userAgent;
      callback({cancel: false, requestHeaders});
    });

    this.setupBrowserWindow();

    // Register protocol
    // Note: we need to create the window before otherwise it does not work
    await SingleSignOn.registerProtocol(this.session, type => this.finalizeLogin(type));

    // Show the window(s)
    await this.ssoWindow?.loadURL(this.windowOriginUrl.toString());

    if (typeof argv[config.ARGUMENT.DEVTOOLS] !== 'undefined') {
      this.ssoWindow?.webContents.openDevTools({mode: 'detach'});
    }
    return this;
  };

  private setupBrowserWindow(): void {
    if (!this.ssoWindow) {
      throw new Error('ssoWindow is not defined');
    }

    const ssoWindow = this.ssoWindow;
    if (this.windowOptions.webPreferences) {
      // Discard old preload URL
      delete this.windowOptions.webPreferences.preload;
    }

    ssoWindow.once('closed', async () => {
      if (this.session) {
        await this.wipeSessionData();
        const unregisterSuccess = SingleSignOn.unregisterProtocol(this.session);
        if (!unregisterSuccess) {
          throw new Error('Failed to unregister protocol');
        }
      }
      this.onClose();
      this.session = undefined;
      this.ssoWindow = undefined;
    });

    // Prevent title updates
    ssoWindow.on('page-title-updated', event => event.preventDefault());
    // Prevent new windows (open external pages in OS browser)
    ssoWindow.webContents.setWindowOpenHandler((details: HandlerDetails): {action: 'deny'} => {
      void WindowUtil.openExternal(details.url, true);
      return {action: 'deny'};
    });

    ssoWindow.webContents.on('will-navigate', (event: ElectronEvent, url: string) => {
      const {origin} = new URL(url);

      if (origin.length > SingleSignOn.MAX_LENGTH_ORIGIN) {
        event.preventDefault();
      }

      ssoWindow.setTitle(SingleSignOn.getWindowTitle(origin));
    });

    if (ENABLE_LOGGING) {
      ssoWindow.webContents.on('console-message', async (_event, _level, message) => {
        const webViewId = getWebViewId(ssoWindow.webContents);
        if (webViewId) {
          const logFilePath = path.join(LOG_DIR, webViewId, config.logFileName);
          try {
            await LogFactory.writeMessage(message, logFilePath);
          } catch (error: any) {
            console.error(`Cannot write to log file "${logFilePath}": ${error.message}`, error);
          }
        }
      });
    }
  }

  close = () => {
    (async () => {
      if (this.session) {
        await this.wipeSessionData();
        const unregisterSuccess = SingleSignOn.unregisterProtocol(this.session);
        if (!unregisterSuccess) {
          console.error('Failed to unregister protocol');
        }
      }
      this.ssoWindow?.close();
      this.session = undefined;
      this.ssoWindow = undefined;
    })()
      .then(console.info)
      .catch(console.info);
  };

  focus = () => {
    this.ssoWindow?.focus();
  };

  // Ensure authenticity of the window from within the code
  public static isSingleSignOnLoginWindow = (frameName: string) => SingleSignOn.SINGLE_SIGN_ON_FRAME_NAME === frameName;

  public static getSingleSignOnLoginWindowOptions = (
    parent: BrowserWindow,
    origin: string,
  ): Electron.BrowserWindowConstructorOptions =>
    WindowUtil.getNewWindowOptions({
      title: SingleSignOn.getWindowTitle(origin),
      parent,
      width: 480,
      height: 600,
    });

  // Returns an empty string if the origin is a Wire backend
  public static getWindowTitle = (origin: string): string =>
    SingleSignOn.ALLOWED_BACKEND_ORIGINS.includes(origin) ? '' : origin;

  private static async copyCookies(fromSession: Session, toSession: Session, url: URL): Promise<void> {
    const cookies = await fromSession.cookies.get({name: 'zuid'});

    for (const cookie of cookies) {
      if (cookie.domain) {
        await toSession.cookies.set({url: url.toString(), ...cookie});
      }
    }

    await toSession.cookies.flushStore();
  }

  private static generateSecret(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(length, (error, bytes) => (error ? reject(error) : resolve(bytes.toString('hex'))));
    });
  }

  private static async registerProtocol(session: Session, finalizeLogin: (type: string) => void): Promise<void> {
    // Generate a new secret to authenticate the custom protocol (wire-sso)
    SingleSignOn.loginAuthorizationSecret = await SingleSignOn.generateSecret(24);

    const handleRequest = (request: ProtocolRequest): void => {
      try {
        const requestURL = new URL(request.url);

        if (requestURL.protocol !== `${SingleSignOn.SSO_PROTOCOL}:`) {
          throw new Error('Protocol is invalid');
        }

        if (requestURL.hostname !== SingleSignOn.SSO_PROTOCOL_HOST) {
          throw new Error('Host is invalid');
        }

        if (typeof SingleSignOn.loginAuthorizationSecret !== 'string') {
          throw new Error('Secret has not be set or has been consumed');
        }

        if (requestURL.searchParams.get('secret') !== SingleSignOn.loginAuthorizationSecret) {
          throw new Error('Secret is invalid');
        }

        const type = requestURL.searchParams.get('type');

        if (typeof type !== 'string') {
          throw new Error('Response is empty');
        }

        if (type.length > SingleSignOn.SSO_PROTOCOL_RESPONSE_SIZE_LIMIT) {
          throw new Error('Response type is too long');
        }

        finalizeLogin(type);
      } catch (error) {
        SingleSignOn.logger.error(error);
      }
    };

    const isRegistered = session.protocol.isProtocolRegistered(SingleSignOn.SSO_PROTOCOL);

    if (!isRegistered) {
      const registerSuccess = session.protocol.registerStringProtocol(SingleSignOn.SSO_PROTOCOL, handleRequest);
      if (!registerSuccess) {
        throw new Error('Failed to register protocol.');
      }
    }
  }

  private static unregisterProtocol(session: Session): boolean {
    return session.protocol.unregisterProtocol(SingleSignOn.SSO_PROTOCOL);
  }

  private readonly finalizeLogin = async (type: string): Promise<void> => {
    if (type === SingleSignOn.RESPONSE_TYPES.AUTH_SUCCESS) {
      if (!this.session) {
        await this.dispatchResponse(SingleSignOn.RESPONSE_TYPES.AUTH_ERROR_SESS_NOT_AVAILABLE);
        return;
      }

      // Set cookies from ephemeral session to the default one
      try {
        await SingleSignOn.copyCookies(this.session, this.senderWebContents.session, this.windowOriginUrl);
      } catch (error) {
        SingleSignOn.logger.warn(error);
        await this.dispatchResponse(SingleSignOn.RESPONSE_TYPES.AUTH_ERROR_COOKIE);
        return;
      }
    }

    await this.dispatchResponse(type);
  };

  private async dispatchResponse(type: string): Promise<void> {
    // Ensure guest window provided type is valid
    const isTypeValid = /^[A-Z_]{1,255}$/g;
    if (isTypeValid.test(type) === false) {
      throw new Error('Invalid type detected, aborting.');
    }

    // Fake postMessage to the webview
    const snippet = `window.dispatchEvent(new MessageEvent('message', {origin: '${this.windowOriginUrl.origin}', data: {type: '${type}'}}))`;
    await executeJavaScriptWithoutResult(snippet, this.senderWebContents);
  }

  private async wipeSessionData() {
    await this.session?.clearStorageData(undefined);
  }
}

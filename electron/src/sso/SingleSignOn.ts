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

const minimist = require('minimist');

import {LogFactory} from '@wireapp/commons';
import * as crypto from 'crypto';
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event as ElectronEvent,
  ProtocolRequest,
  Session,
  session,
  WebContents,
} from 'electron';
import * as path from 'path';
import {URL} from 'url';

import {ENABLE_LOGGING, getLogger} from '../logging/getLogger';
import {config} from '../settings/config';
import {getWebViewId} from '../runtime/lifecycle';

const argv = minimist(process.argv.slice(1));
const LOG_DIR = path.join(app.getPath('userData'), 'logs');

export class SingleSignOn {
  private static readonly ALLOWED_BACKEND_ORIGINS = config.backendOrigins;
  private static readonly PRELOAD_SSO_JS = path.join(
    app.getAppPath(),
    config.electronDirectory,
    'dist/preload/preload-sso.js',
  );
  private static readonly SINGLE_SIGN_ON_FRAME_NAME = 'WIRE_SSO';
  private static readonly SSO_PROTOCOL = 'wire-sso';
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
  private readonly mainBrowserWindow: BrowserWindow;
  private readonly mainSession: Session;
  private readonly senderEvent: ElectronEvent;
  private readonly senderWebContents: WebContents;
  private readonly windowOptions: BrowserWindowConstructorOptions;
  private readonly windowOriginUrl: URL;

  constructor(
    mainBrowserWindow: BrowserWindow,
    senderEvent: ElectronEvent,
    windowOriginURL: string,
    windowOptions: BrowserWindowConstructorOptions,
  ) {
    this.mainBrowserWindow = mainBrowserWindow;
    this.windowOptions = windowOptions;
    this.senderEvent = senderEvent;
    this.senderWebContents = (senderEvent as any).sender;
    this.mainSession = this.senderWebContents.session;
    this.windowOriginUrl = new URL(windowOriginURL);
  }

  public readonly init = async (): Promise<void> => {
    // Create a ephemeral and isolated session
    this.session = session.fromPartition(SingleSignOn.SSO_SESSION_NAME, {cache: false});

    // Disable browser permissions (microphone, camera...)
    this.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

    // User-agent normalization
    this.session.webRequest.onBeforeSendHeaders(({requestHeaders}: any, callback) => {
      requestHeaders['User-Agent'] = config.userAgent;
      callback({cancel: false, requestHeaders});
    });

    this.ssoWindow = this.createBrowserWindow();

    // Register protocol
    // Note: we need to create the window before otherwise it does not work
    await SingleSignOn.registerProtocol(this.session, type => this.finalizeLogin(type));

    // Show the window(s)
    await this.ssoWindow.loadURL(this.windowOriginUrl.toString());

    if (argv[config.ARGUMENT.DEVTOOLS]) {
      this.ssoWindow.webContents.openDevTools({mode: 'detach'});
    }
  };

  private createBrowserWindow(): BrowserWindow {
    // Discard old preload URL
    delete (this.windowOptions as any).webPreferences.preloadURL;
    delete (this.windowOptions as any).webPreferences.preload;

    const ssoWindow = new BrowserWindow({
      ...this.windowOptions,
      alwaysOnTop: true,
      backgroundColor: '#FFFFFF',
      fullscreen: false,
      fullscreenable: false,
      height: this.windowOptions.height || 600,
      maximizable: false,
      minimizable: false,
      modal: false,
      movable: false,
      parent: this.mainBrowserWindow,
      resizable: false,
      title: SingleSignOn.getWindowTitle(this.windowOriginUrl.origin),
      titleBarStyle: 'default',
      useContentSize: true,
      webPreferences: {
        ...this.windowOptions.webPreferences,
        allowRunningInsecureContent: false,
        backgroundThrottling: false,
        contextIsolation: true,
        devTools: true,
        disableBlinkFeatures: '',
        experimentalFeatures: false,
        images: true,
        javascript: true,
        nativeWindowOpen: false,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        offscreen: false,
        partition: '',
        plugins: false,
        preload: SingleSignOn.PRELOAD_SSO_JS,
        sandbox: true,
        scrollBounce: true,
        session: this.session,
        spellcheck: false,
        textAreasAreResizable: false,
        webSecurity: true,
        webgl: false,
        webviewTag: false,
        worldSafeExecuteJavaScript: true,
      },
      width: this.windowOptions.width || 480,
    });

    (this.senderEvent as any).newGuest = ssoWindow;

    ssoWindow.once('closed', async () => {
      if (this.session) {
        await this.wipeSessionData();
        const unregisterSuccess = SingleSignOn.unregisterProtocol(this.session);
        if (!unregisterSuccess) {
          throw new Error('Failed to unregister protocol');
        }
      }
      this.session = undefined;
      this.ssoWindow = undefined;
    });

    // Prevent title updates and new windows
    ssoWindow.on('page-title-updated', event => event.preventDefault());
    ssoWindow.webContents.on('new-window', event => event.preventDefault());

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
          } catch (error) {
            console.error(`Cannot write to log file "${logFilePath}": ${error.message}`, error);
          }
        }
      });
    }

    return ssoWindow;
  }

  // Ensure authenticity of the window from within the code
  public static isSingleSignOnLoginWindow = (frameName: string) => SingleSignOn.SINGLE_SIGN_ON_FRAME_NAME === frameName;

  // Returns an empty string if the origin is a Wire backend
  public static getWindowTitle = (origin: string): string =>
    SingleSignOn.ALLOWED_BACKEND_ORIGINS.includes(origin) ? '' : origin;

  // `window.opener` is not available when sandbox is activated,
  // therefore we need to fake the function on backend area and
  // redirect the response to a custom protocol
  public static readonly getWindowOpenerScript = (): string => {
    return `Object.defineProperty(window, 'opener', {
      configurable: true, // Needed on Chrome :(
      enumerable: false,
      value: Object.freeze({
        postMessage: ({type}) => {
          const params = new URLSearchParams();
          params.set('secret', '${SingleSignOn.loginAuthorizationSecret}');
          params.set('type', type);
          const url = new URL('${SingleSignOn.SSO_PROTOCOL}://${SingleSignOn.SSO_PROTOCOL_HOST}/');
          url.search = params.toString();
          document.location.href = url.toString();
        }
      }),
      writable: false,
    });`;
  };

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
        await SingleSignOn.copyCookies(this.session, this.mainSession, this.windowOriginUrl);
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
    await this.senderWebContents.executeJavaScript(
      `window.dispatchEvent(new MessageEvent('message', {origin: '${this.windowOriginUrl.origin}', data: {type: '${type}'}}));`,
    );
  }

  private async wipeSessionData() {
    if (this.session) {
      await this.session.clearStorageData(undefined);
    }
  }
}

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

import {BrowserWindow, app, session} from 'electron';
import * as minimist from 'minimist';
import * as path from 'path';
import {URL} from 'url';

const argv = minimist(process.argv.slice(1));

const APP_PATH = app.getAppPath();

class SingleSignOn {
  private static readonly ALLOWED_BACKEND_ORIGINS = [
    'https://staging-nginz-https.zinfra.io',
    'https://prod-nginz-https.wire.com',
  ];
  private static readonly PRELOAD_SSO_JS = path.join(APP_PATH, 'dist', 'js', 'preload-sso.js');
  private static readonly BACKEND_COOKIE_NAME = 'zuid';
  private static readonly SINGLE_SIGN_ON_FRAME_NAME = 'WIRE_SSO';
  private static readonly SSO_PROTOCOL = 'wire-sso';
  private static readonly SSO_PROTOCOL_FULL = SingleSignOn.SSO_PROTOCOL.length + '://'.length;
  private static readonly SSO_PROTOCOL_RESPONSE_SIZE_LIMIT = 255;

  private isLoginFinalized: boolean = false;

  private static readonly RESPONSE_TYPES = {
    AUTH_ERROR_COOKIE: 'AUTH_ERROR_COOKIE',
    AUTH_ERROR_SESS_NOT_AVAILABLE: 'AUTH_ERROR_SESS_NOT_AVAILABLE',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
  };

  private readonly session: Electron.Session | undefined;
  private readonly senderWebContents: Electron.WebContents;
  private readonly windowOriginUrl: URL;

  private static readonly cookies = {
    copy: async (from: Electron.Session, to: Electron.Session, url: URL) => {
      const cookies = await SingleSignOn.cookies.getBackendCookies(from, url);
      for (const cookie of cookies) {
        await SingleSignOn.cookies.setCookie(to, cookie, url.toString());
      }
      await SingleSignOn.cookies.flushCookies(to);
    },
    flushCookies: (session: Electron.Session): Promise<void> => {
      return new Promise((resolve, reject) => {
        session.cookies.flushStore(() => resolve());
      });
    },
    getBackendCookies: (session: Electron.Session, url: URL): Promise<Electron.Cookie[]> => {
      return new Promise((resolve, reject) => {
        const rootDomain = url.hostname
          .split('.')
          .reverse()
          .splice(0, 2)
          .reverse()
          .join('.');
        session.cookies.get(
          {domain: rootDomain, secure: true, name: SingleSignOn.BACKEND_COOKIE_NAME},
          (error, cookies) => {
            if (error) {
              return reject(error);
            }
            resolve(cookies);
          }
        );
      });
    },
    setCookie: (session: Electron.Session, cookie: Electron.Cookie, url: string) => {
      return new Promise((resolve, reject) => {
        session.cookies.set({url, ...(<Electron.Details>cookie)}, error => {
          if (error) {
            return reject(error);
          }
          resolve();
        });
      });
    },
  };

  private static readonly protocol = {
    register: (session: Electron.Session, callback: Function): void => {
      session.protocol.registerStringProtocol(
        SingleSignOn.SSO_PROTOCOL,
        (request, protocolCallback) => {
          const type = request.url.substring(
            SingleSignOn.SSO_PROTOCOL_FULL,
            SingleSignOn.SSO_PROTOCOL_RESPONSE_SIZE_LIMIT
          );
          callback(type);
          protocolCallback('');
        },
        error => {
          if (error) {
            throw new Error(`Failed to register protocol. Error: ${error}`);
          }
        }
      );
    },

    unregister: (session: Electron.Session): Promise<void> => {
      return new Promise((resolve, reject) => {
        session.protocol.unregisterProtocol(SingleSignOn.SSO_PROTOCOL, error => {
          if (error) {
            reject(error);
          }
          resolve();
        });
      });
    },
  };

  public static isSingleSignOnLoginWindow = (frameName: string) => {
    return (
      SingleSignOn.SINGLE_SIGN_ON_FRAME_NAME === frameName // Ensure authenticity of the window from within the code
    );
  };

  public static isBackendOrigin = (url: string) => {
    return SingleSignOn.ALLOWED_BACKEND_ORIGINS.includes(new URL(url).origin);
  };

  constructor(
    private readonly mainBrowserWindow: Electron.BrowserWindow,
    private readonly mainSession: Electron.Session,
    private readonly senderEvent: Electron.Event,
    windowOriginUrl: string,
    private readonly windowOptions: Electron.BrowserWindowConstructorOptions
  ) {
    this.senderWebContents = senderEvent.sender;
    this.windowOriginUrl = new URL(windowOriginUrl);
  }

  init() {
    // Create a ephemeral and isolated session
    this.session = session.fromPartition('sso', {cache: false});

    // Disable browser permissions (microphone, camera...)
    this.session.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(false);
    });

    // Register wire-sso protocol for this session
    SingleSignOn.protocol.register(this.session, (type: string) => this.finalizeLogin(type));

    // Remove old preload URL
    delete (<any>this.windowOptions).webPreferences.preloadURL;

    const SingleSignOnLoginWindow: Electron.BrowserWindow = new BrowserWindow({
      ...this.windowOptions,
      parent: this.mainBrowserWindow,
      resizable: false,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        ...this.windowOptions.webPreferences,
        allowRunningInsecureContent: false,
        contextIsolation: true,
        devTools: true,
        experimentalFeatures: false,
        preload: SingleSignOn.PRELOAD_SSO_JS,
        sandbox: true,
        session: this.session,
        webSecurity: true,
        webviewTag: false,
      },
    });
    (<any>this.senderEvent).newGuest = SingleSignOnLoginWindow;
    SingleSignOnLoginWindow.once('closed', async () => {
      if (this.session) {
        await this.wipeSessionData();
        await SingleSignOn.protocol.unregister(this.session);
      }
      this.session = undefined;
    });

    // ToDo: Ensure certificate pinning is applied

    SingleSignOnLoginWindow.loadURL(this.windowOriginUrl.toString());

    if (argv.devtools) {
      SingleSignOnLoginWindow.webContents.openDevTools({mode: 'detach'});
    }
  }

  private readonly finalizeLogin = async (type: string): Promise<void> => {
    if (this.isLoginFinalized) {
      return;
    }
    this.isLoginFinalized = true;

    if (type === SingleSignOn.RESPONSE_TYPES.AUTH_SUCCESS) {
      if (!this.session) {
        await this.dispatchResponse(SingleSignOn.RESPONSE_TYPES.AUTH_ERROR_SESS_NOT_AVAILABLE);
        return;
      }

      // Set cookies from ephemeral session to the default one
      try {
        await SingleSignOn.cookies.copy(this.session, this.mainSession, this.windowOriginUrl);
      } catch (error) {
        await this.dispatchResponse(SingleSignOn.RESPONSE_TYPES.AUTH_ERROR_COOKIE);
        return;
      }
    }

    await this.dispatchResponse(type);
  };

  private readonly dispatchResponse = async (type: string): Promise<void> => {
    // Ensure guest window provided type is valid
    if (/^[A-Z_]{1,255}$/g.test(type) === false) {
      throw new Error('Invalid type detected, aborting.');
    }

    // Fake postMessage to the webview
    await this.senderWebContents.executeJavaScript(
      `window.dispatchEvent(new MessageEvent('message', {origin: '${
        this.windowOriginUrl.origin
      }', data: {type: '${type}'}, type: {isTrusted: true}}));`
    );
  };

  private readonly wipeSessionData = () => {
    return new Promise((resolve, reject) => {
      if (this.session) {
        this.session.clearStorageData({}, () => resolve());
      } else {
        resolve();
      }
    });
  };
}

export {SingleSignOn};

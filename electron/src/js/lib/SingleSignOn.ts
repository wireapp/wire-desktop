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

import * as crypto from 'crypto';
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
  private static readonly SSO_PROTOCOL_HOST = 'response';
  private static readonly SSO_PROTOCOL_RESPONSE_SIZE_LIMIT = 255;

  private static readonly RESPONSE_TYPES = {
    AUTH_ERROR_COOKIE: 'AUTH_ERROR_COOKIE',
    AUTH_ERROR_SESS_NOT_AVAILABLE: 'AUTH_ERROR_SESS_NOT_AVAILABLE',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
  };

  public static loginAuthorizationSecret: string | undefined;

  private session: Electron.Session | undefined;
  private readonly mainSession: Electron.Session;
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
    generateSecret: (length: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(length, (error, bytes) => {
          if (error) {
            return reject(error);
          }

          resolve(bytes.toString('hex'));
        });
      });
    },
    register: async (session: Electron.Session, callback: Function): Promise<void> => {
      // Generate a new secret to authenticate the custom protocol
      SingleSignOn.loginAuthorizationSecret = await SingleSignOn.protocol.generateSecret(24);

      session.protocol.registerStringProtocol(
        SingleSignOn.SSO_PROTOCOL,
        (request, response) => {
          try {
            const url = new URL(request.url);

            if (url.protocol !== `${SingleSignOn.SSO_PROTOCOL}:`) {
              throw new Error('Protocol is invalid');
            }
            if (url.hostname !== SingleSignOn.SSO_PROTOCOL_HOST) {
              throw new Error('Host is invalid');
            }

            if (typeof SingleSignOn.loginAuthorizationSecret !== 'string') {
              throw new Error('Secret has not be set or has been consumed');
            }

            if (url.searchParams.get('secret') !== SingleSignOn.loginAuthorizationSecret) {
              throw new Error('Secret is invalid');
            }

            const type = url.searchParams.get('type');

            if (typeof type !== 'string') {
              throw new Error('Response is empty');
            }

            if (type.length > SingleSignOn.SSO_PROTOCOL_RESPONSE_SIZE_LIMIT) {
              throw new Error('Response type is too long');
            }

            SingleSignOn.loginAuthorizationSecret = undefined;
            callback(type);
            response('Please wait...');
          } catch (error) {
            response(`An error happened, please close the window and try again. Error: ${error.toString()}`);
          }
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
    // Ensure authenticity of the window from within the code
    return SingleSignOn.SINGLE_SIGN_ON_FRAME_NAME === frameName;
  };

  public static isBackendOrigin = (url: string) => {
    // Ensure the requested URL is going to the backend
    return SingleSignOn.ALLOWED_BACKEND_ORIGINS.includes(new URL(url).origin);
  };

  public static javascriptHelper = () => {
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

  constructor(
    private readonly mainBrowserWindow: Electron.BrowserWindow,
    private readonly senderEvent: Electron.Event,
    windowOriginUrl: string,
    private readonly windowOptions: Electron.BrowserWindowConstructorOptions
  ) {
    this.mainSession = this.mainBrowserWindow.webContents.session;
    this.senderWebContents = senderEvent.sender;
    this.windowOriginUrl = new URL(windowOriginUrl);
  }

  public readonly init = async (): Promise<void> => {
    // Create a ephemeral and isolated session
    this.session = session.fromPartition('sso', {cache: false});

    // Disable browser permissions (microphone, camera...)
    this.session.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(false);
    });

    const SingleSignOnLoginWindow = this.createBrowserWindow();

    // Register protocol
    // Note: we need to create the window before otherwise it does not work
    await SingleSignOn.protocol.register(this.session, (responseType: string) => this.finalizeLogin(responseType));

    // Show the window(s)
    SingleSignOnLoginWindow.loadURL(this.windowOriginUrl.toString());
    if (argv.devtools) {
      SingleSignOnLoginWindow.webContents.openDevTools({mode: 'detach'});
    }
  };

  private readonly createBrowserWindow = (): Electron.BrowserWindow => {
    // Discard old preload URL
    delete (<any>this.windowOptions).webPreferences.preloadURL;

    const SingleSignOnLoginWindow: Electron.BrowserWindow = new BrowserWindow({
      ...this.windowOptions,
      height: this.windowOptions.height || 600,
      parent: this.mainBrowserWindow,
      resizable: false,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        ...this.windowOptions.webPreferences,
        allowRunningInsecureContent: false,
        backgroundThrottling: false,
        contextIsolation: true,
        devTools: true,
        disableBlinkFeatures: '',
        enableBlinkFeatures: '',
        experimentalCanvasFeatures: false,
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
        textAreasAreResizable: false,
        webSecurity: true,
        webgl: false,
        webviewTag: false,
      },
      width: this.windowOptions.width || 480,
    });

    (<any>this.senderEvent).newGuest = SingleSignOnLoginWindow;

    SingleSignOnLoginWindow.once('closed', async () => {
      if (this.session) {
        await this.wipeSessionData();
        await SingleSignOn.protocol.unregister(this.session);
      }
      this.session = undefined;
    });

    return SingleSignOnLoginWindow;
  };

  private readonly finalizeLogin = async (type: string): Promise<void> => {
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

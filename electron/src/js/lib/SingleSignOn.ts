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

const argv = minimist(process.argv.slice(1));

const APP_PATH = app.getAppPath();

class SingleSignOn {
  private static readonly BACKEND_URL = 'https://staging-nginz-https.zinfra.io';
  private static readonly PRELOAD_SSO_JS = path.join(APP_PATH, 'dist', 'js', 'preload-sso.js');
  private static readonly BACKEND_COOKIE_NAME = 'zuid';
  private static readonly SINGLE_SIGN_ON_FRAME_NAME = 'WIRE_SSO';
  private static readonly SSO_PROTOCOL = 'wire-sso';
  private static readonly SSO_PROTOCOL_FULL = SingleSignOn.SSO_PROTOCOL.length + '://'.length;
  private static readonly SSO_PROTOCOL_RESPONSE_SIZE_LIMIT = 255;

  private session: Electron.Session;

  private static cookies = {
    copy: async (from: Electron.Session, to: Electron.Session) => {
      const cookies = await SingleSignOn.cookies.getBackendCookies(from);
      for (const cookie of cookies) {
        await SingleSignOn.cookies.setCookie(to, cookie);
      }
      await SingleSignOn.cookies.flushCookies(to);
    },
    flushCookies: (session: Electron.Session): Promise<void> => {
      return new Promise((resolve, reject) => {
        session.cookies.flushStore(() => resolve());
      });
    },
    getBackendCookies: (session: Electron.Session): Promise<Electron.Cookie[]> => {
      return new Promise((resolve, reject) => {
        // ToDo: Ensure it comes from backend servers
        session.cookies.get({secure: true, name: SingleSignOn.BACKEND_COOKIE_NAME}, (error, cookies) => {
          if (error) {
            return reject(error);
          }
          resolve(cookies);
        });
      });
    },
    setCookie: (session: Electron.Session, cookie: Electron.Cookie) => {
      return new Promise((resolve, reject) => {
        // ToDo: Fix BACKEND_URL to use proper url
        session.cookies.set({url: SingleSignOn.BACKEND_URL, ...(<Electron.Details>cookie)}, error => {
          if (error) {
            return reject(error);
          }
          resolve();
        });
      });
    },
  };

  public static isSingleSignOnLogin = (frameName: string) => {
    return (
      SingleSignOn.SINGLE_SIGN_ON_FRAME_NAME === frameName // Ensure authenticity of the window from within the code
      // ToDo: Add URLs checks
    );
  };

  constructor(
    private senderWebContents: Electron.WebContents,
    mainBrowserWindow: Electron.BrowserWindow,
    private mainSession: Electron.Session,
    event: any,
    windowUrl: string,
    windowOptions: Electron.BrowserWindowConstructorOptions
  ) {
    // Create a ephemeral and isolated session
    // ToDo: Randomize session name
    this.session = session.fromPartition('sso', {cache: false});

    // Disable browser permissions (microphone, camera...)
    this.session.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(false);
    });

    // Register wire-sso protocol for this session
    this.session.protocol.registerStringProtocol(
      SingleSignOn.SSO_PROTOCOL,
      (request, callback) => {
        const type = request.url.substring(
          SingleSignOn.SSO_PROTOCOL_FULL,
          SingleSignOn.SSO_PROTOCOL_RESPONSE_SIZE_LIMIT
        );
        this.finalizeLogin(type);
        callback('');
      },
      error => {
        if (error) {
          console.error('Failed to register protocol');
        }
      }
    );

    // Remove old preload URL
    delete (<any>windowOptions).webPreferences.preloadURL;

    const SingleSignOnLoginWindow: Electron.BrowserWindow = new BrowserWindow({
      ...windowOptions,
      parent: mainBrowserWindow,
      resizable: false,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        ...windowOptions.webPreferences,
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
    event.newGuest = SingleSignOnLoginWindow;
    SingleSignOnLoginWindow.loadURL(windowUrl);
    if (argv.devtools) {
      SingleSignOnLoginWindow.webContents.openDevTools({mode: 'detach'});
    }
  }

  private finalizeLogin = async (type: string) => {
    if (type === 'AUTH_SUCCESS') {
      // Set cookies from ephemeral session to the default one
      try {
        await SingleSignOn.cookies.copy(this.session, this.mainSession);
      } catch (error) {
        console.log(error);
        return this.dispatchResponse('AUTH_ERROR_UNKNOWN');
      }
    }

    return this.dispatchResponse(type);
  };

  private dispatchResponse = (type: string) => {
    // Ensure guest window provided type is valid
    if (/^[A-Z_]{1,255}$/g.test(type) === false) {
      throw new Error('Invalid type detected, aborting.');
    }

    // Fake postMessage to the webview
    this.senderWebContents.executeJavaScript(
      `window.dispatchEvent(new MessageEvent('message', {origin: '${
        SingleSignOn.BACKEND_URL
      }', data: {type: '${type}'}, type: {isTrusted: false}}));`
    );
  };
}

export {SingleSignOn};

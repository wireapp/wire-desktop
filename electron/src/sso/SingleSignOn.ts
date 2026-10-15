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

import {app, BrowserWindow, Event as ElectronEvent, Session, session, WebContents, HandlerDetails} from 'electron';
import {Maybe} from 'true-myth';

import * as path from 'path';
import {URL} from 'url';

import {parseSsoPayload, SsoPayload} from './ssoResult';

import {registerTextPrompt} from '../auth/TextPrompt';
import {writeBoundedLogMessage} from '../logging/desktopLogWriter';
import {ENABLE_LOGGING, getLogger} from '../logging/getLogger';
import {getLogDirectory, getSsoLogPath} from '../logging/logPaths';
import {config} from '../settings/config';
import * as WindowUtil from '../window/WindowUtil';

const minimist = require('minimist');

const argv = minimist(process.argv.slice(1));

export class SingleSignOn {
  private static readonly ALLOWED_BACKEND_ORIGINS = config.backendOrigins;
  private static readonly SINGLE_SIGN_ON_FRAME_NAME = 'WIRE_SSO';
  // Shared across accounts, but separate from their removable webview partitions.
  // Electron stores the Touch ID metadata secret in this persistent session.
  private static readonly SSO_SESSION_NAME = 'persist:wire-sso';
  private static readonly MAX_LENGTH_ORIGIN_DOMAIN = 255;
  private static readonly MAX_LENGTH_ORIGIN = 'https://'.length + SingleSignOn.MAX_LENGTH_ORIGIN_DOMAIN;
  private static readonly logger = getLogger(path.basename(__filename));

  private static readonly RESPONSE_TYPES = {
    AUTH_ERROR_COOKIE: 'AUTH_ERROR_COOKIE',
    AUTH_ERROR_SESS_NOT_AVAILABLE: 'AUTH_ERROR_SESS_NOT_AVAILABLE',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
  };

  private session: Session | undefined;
  private ssoWindow: BrowserWindow | undefined;
  private readonly senderWebContents: WebContents;
  private readonly accountId: Maybe<string>;
  private readonly windowOriginUrl: URL;
  public onClose = () => {};
  private completion: Promise<void> | undefined;

  constructor(
    ssoWindow: BrowserWindow,
    senderWebContents: WebContents,
    accountId: Maybe<string>,
    windowOriginURL: string,
  ) {
    this.ssoWindow = ssoWindow;
    this.senderWebContents = senderWebContents;
    this.accountId = accountId;
    this.windowOriginUrl = new URL(windowOriginURL);
  }

  public readonly init = async (): Promise<SingleSignOn> => {
    this.setupBrowserWindow();
    // Configure the actual popup session and cookie cleanup.
    this.session = this.ssoWindow!.webContents.session;
    if (this.session === this.senderWebContents.session || !this.session.isPersistent()) {
      throw new Error('SSO requires a separate persistent session.');
    }
    SingleSignOn.logger.info('[Passkeys] Using shared persistent SSO session, separate from account data.');
    // Discard website state left by an interrupted login, retaining preferences.
    await this.session.clearStorageData();

    // Disable browser permissions (microphone, camera...)
    this.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

    // User-agent normalization
    this.session.webRequest.onBeforeSendHeaders(({requestHeaders}: any, callback) => {
      requestHeaders['User-Agent'] = config.userAgent;
      callback({cancel: false, requestHeaders});
    });

    registerTextPrompt(this.ssoWindow!);
    const popup = this.ssoWindow!;
    popup.webContents.ipc.handle('wire:sso-complete', async (event, type: unknown, rawPayload: unknown) => {
      if (
        event.senderFrame !== popup.webContents.mainFrame ||
        typeof type !== 'string' ||
        !['AUTH_SUCCESS', 'AUTH_ERROR', 'AUTH_ERROR_COOKIE'].includes(type)
      ) {
        return false;
      }
      if (new URL(event.senderFrame.url).origin !== this.windowOriginUrl.origin) {
        SingleSignOn.logger.warn('[Passkeys] Rejected SSO result from an unexpected origin.');
        return false;
      }
      const payload = parseSsoPayload(rawPayload);
      if (rawPayload !== undefined && !payload) {
        return false;
      }
      this.completion ??= this.finalizeLogin(type, payload);
      await this.completion;
      return true;
    });
    popup.webContents.ipc.on('wire:sso-close', event => {
      if (event.senderFrame === popup.webContents.mainFrame) {
        this.close();
      }
    });
    this.senderWebContents.once('destroyed', this.close);

    // Show the window(s)
    await this.ssoWindow?.loadURL(this.windowOriginUrl.toString());
    this.ssoWindow?.show();

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
    ssoWindow.once('closed', async () => {
      this.senderWebContents.removeListener('destroyed', this.close);
      try {
        if (this.session) {
          await this.wipeSessionData();
        }
      } catch {
        SingleSignOn.logger.warn('Unable to clear SSO website data. It will be cleared before the next login.');
      } finally {
        this.session = undefined;
        this.ssoWindow = undefined;
        this.onClose();
      }
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
        if (this.accountId.isJust) {
          const logFilePath = getSsoLogPath({
            accountId: this.accountId.value,
            date: new Date(),
            logDirectory: getLogDirectory(),
          });
          try {
            await writeBoundedLogMessage({logFilePath, message});
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            console.error('Cannot write to log file:', logFilePath, errorMessage, error);
          }
        }
      });
    }
  }

  close = () => {
    this.ssoWindow?.close();
  };

  focus = () => {
    this.ssoWindow?.focus();
  };

  // Ensure authenticity of the window from within the code
  public static isSingleSignOnLoginWindow = (frameName: string) => SingleSignOn.SINGLE_SIGN_ON_FRAME_NAME === frameName;

  public static getSingleSignOnLoginWindowOptions = (
    parent: BrowserWindow,
    origin: string,
  ): Electron.BrowserWindowConstructorOptions => {
    const options = WindowUtil.getNewWindowOptions({
      title: SingleSignOn.getWindowTitle(origin),
      parent,
      width: 480,
      height: 600,
    });
    return {
      ...options,
      show: false,
      webPreferences: {
        ...options.webPreferences,
        session: session.fromPartition(SingleSignOn.SSO_SESSION_NAME, {cache: false}),
        partition: SingleSignOn.SSO_SESSION_NAME,
        preload: path.join(app.getAppPath(), config.electronDirectory, 'dist/preload/preload-sso.js'),
      },
    };
  };

  // Returns an empty string if the origin is a Wire backend
  public static getWindowTitle = (origin: string): string =>
    SingleSignOn.ALLOWED_BACKEND_ORIGINS.includes(origin) ? '' : origin;

  private static async copyCookies(fromSession: Session, toSession: Session, url: URL): Promise<void> {
    // Use /access, since the login cookie may have a path that excludes /sso.
    const cookieUrl = new URL('/access', url.origin).toString();
    const cookies = await fromSession.cookies.get({name: 'zuid', url: cookieUrl});
    if (cookies.length === 0) {
      throw new Error('SSO completed without a Wire authentication cookie.');
    }

    for (const cookie of cookies) {
      const {name, value, path, secure, httpOnly, expirationDate, sameSite} = cookie;
      await toSession.cookies.set({url: cookieUrl, name, value, path, secure, httpOnly, expirationDate, sameSite});
    }

    await toSession.cookies.flushStore();
    SingleSignOn.logger.info('[Passkeys] Wire authentication cookie transferred to the requesting account.');
  }

  private readonly finalizeLogin = async (type: string, payload?: SsoPayload): Promise<void> => {
    if (type === SingleSignOn.RESPONSE_TYPES.AUTH_SUCCESS) {
      if (!this.session) {
        await this.dispatchResponse(SingleSignOn.RESPONSE_TYPES.AUTH_ERROR_SESS_NOT_AVAILABLE);

        return;
      }

      // Copy the Wire authentication cookies to the requesting account's session.
      try {
        await SingleSignOn.copyCookies(this.session, this.senderWebContents.session, this.windowOriginUrl);
      } catch (error) {
        SingleSignOn.logger.warn(error);
        await this.dispatchResponse(SingleSignOn.RESPONSE_TYPES.AUTH_ERROR_COOKIE);

        return;
      }
    }

    await this.dispatchResponse(type, payload);
  };

  private async dispatchResponse(type: string, payload?: SsoPayload): Promise<void> {
    // Ensure guest window provided type is valid
    const isTypeValid = /^[A-Z_]{1,255}$/g;
    if (isTypeValid.test(type) === false) {
      throw new Error('Invalid type detected, aborting.');
    }

    if (this.senderWebContents.isDestroyed()) {
      return;
    }
    // Preserve the backend base URL format used by the webapp (which may include
    // a trailing slash). Native origin checks above always use URL.origin.
    const marker = '/sso/initiate-login/';
    const originalUrl = this.windowOriginUrl.toString();
    const index = originalUrl.indexOf(marker);
    const origin = index >= 0 ? originalUrl.slice(0, index) : this.windowOriginUrl.origin;
    this.senderWebContents.send('wire:sso-result', {origin, type, ...(payload ? {payload} : {})});
  }

  private async wipeSessionData() {
    // Chromium's native window.open popup can inherit the opener's session even
    // when BrowserWindow options request another partition. Never wipe account
    // storage here: doing so removes the login cookie immediately after success.
    if (this.senderWebContents && this.session === this.senderWebContents.session) {
      SingleSignOn.logger.info('[Passkeys] Preserved account session when closing native SSO popup.');
      return;
    }
    // Remove website storage/cookies, preserving session preferences (including
    // Electron's WebAuthn metadata secret) and the keychain credentials.
    await this.session?.clearStorageData(undefined);
    SingleSignOn.logger.info('[Passkeys] Cleared SSO website data; retained shared passkey session preferences.');
  }
}

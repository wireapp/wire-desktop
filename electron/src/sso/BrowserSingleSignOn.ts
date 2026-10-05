/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import {BrowserWindow, WebContents} from 'electron';

import {randomUUID} from 'crypto';

import {createBrowserSsoRequest, parseBrowserSsoCallback, SSO_TIMEOUT_MS} from './browserSsoCallback';
import {startMacWebAuthentication, WebAuthenticationRequest} from './MacWebAuthentication';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger('BrowserSingleSignOn');

export class BrowserSingleSignOn {
  public onClose = () => {};
  private request?: WebAuthenticationRequest;
  private closed = false;
  private installingCookie = false;
  private notifiedClose = false;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly parent: BrowserWindow,
    private readonly sender: WebContents,
    private readonly loginUrl: string,
    private readonly authenticate = startMacWebAuthentication,
  ) {}

  public async init(): Promise<void> {
    const state = randomUUID();
    const expiresAt = Date.now() + SSO_TIMEOUT_MS;
    const scheme = config.customProtocolName;
    let stage = 'starting';
    try {
      const url = createBrowserSsoRequest(this.loginUrl, scheme, state);
      this.sender.once('destroyed', this.close);
      this.sender.on('did-start-navigation', this.onNavigation);
      this.parent.once('closed', this.close);
      this.timer = setTimeout(this.close, SSO_TIMEOUT_MS);
      logger.info('[SSO] Starting macOS browser authentication.');
      this.request = this.authenticate(this.parent, url.toString(), scheme);
      logger.info('[SSO] Native browser authentication start returned; awaiting completion.');
      stage = 'waiting for browser';
      const callback = await this.request.result;
      stage = 'validating callback';
      if (this.closed || this.sender.isDestroyed()) {
        return;
      }
      const cookie = parseBrowserSsoCallback(callback, url, scheme, state, expiresAt);
      // The system session delivers the callback directly to this request. Never
      // accept these cookies via generic open-url or renderer IPC handlers.
      stage = 'installing session cookie';
      this.installingCookie = true;
      let installed = false;
      try {
        await this.sender.session.cookies.set(cookie);
        installed = true;
        await this.sender.session.cookies.flushStore();
        if (this.closed || this.sender.isDestroyed()) {
          throw new Error('Login cancelled during cookie installation.');
        }
      } catch {
        if (installed) {
          // A failed/abandoned attempt must not leave a usable new session.
          await this.sender.session.cookies.remove(cookie.url, 'zuid');
        }
        throw new Error('Unable to install the SSO cookie.');
      } finally {
        this.installingCookie = false;
      }
      logger.info('[SSO] Wire session cookie installed in the requesting account.');
      this.sendResult('AUTH_SUCCESS');
    } catch {
      // Callback and native errors can include reusable credentials: log neither.
      if (!this.closed) {
        logger.warn(`[SSO] Browser authentication failed or was cancelled while ${stage}.`);
        this.sendResult('AUTH_ERROR');
      }
    } finally {
      this.close();
      this.notifyClose();
    }
  }

  private sendResult(type: string): void {
    if (!this.sender.isDestroyed()) {
      const index = this.loginUrl.indexOf('/sso/initiate-login/');
      this.sender.send('wire:sso-result', {origin: this.loginUrl.slice(0, index), type});
    }
  }

  private onNavigation = (_event: unknown, _url: string, isInPlace: boolean, isMainFrame: boolean) => {
    if (isMainFrame && !isInPlace) {
      this.close();
    }
  };

  public close = (): void => {
    if (this.closed) {
      return;
    }
    this.closed = true;
    clearTimeout(this.timer);
    this.request?.cancel();
    this.request = undefined;
    this.sender.removeListener('destroyed', this.close);
    this.sender.removeListener('did-start-navigation', this.onNavigation);
    this.parent.removeListener('closed', this.close);
    if (!this.installingCookie) {
      this.notifyClose();
    }
  };

  private notifyClose(): void {
    if (this.notifiedClose) {
      return;
    }
    this.notifiedClose = true;
    this.onClose();
  }

  public focus = (): void => {
    if (this.closed) {
      return;
    }
    if (this.request && !this.request.focus()) {
      logger.warn('[SSO] Unable to bring the authentication browser forward. Switch to the browser to continue.');
    }
  };
}

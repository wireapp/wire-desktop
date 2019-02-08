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

import {WebContents, WebviewTag, app} from 'electron';
import {BaseError} from 'make-error-cause';
import {URL} from 'url';
const dialog = require('electron').dialog || require('electron').remote.dialog;
import * as windowManager from '../js/window-manager';
import {getText} from '../locale/locale';
import {EVENT_TYPE} from './eventType';

class MaximumAccountsReachedError extends BaseError {}

class AutomatedSingleSignOn {
  private static readonly SSO_LOGIN_HASH = 'sso/';
  public static readonly handleProtocolRequest = async (route: URL) => {
    if (typeof route.pathname !== 'string') {
      return;
    }

    const sendCodeToRenderer = () => {
      const code = route.pathname.trim().substr(1);
      main.webContents.send(EVENT_TYPE.ACCOUNT.SSO_LOGIN, code);
    };

    await app.whenReady();

    const main = windowManager.getPrimaryWindow();
    if (main.webContents.isLoading()) {
      // App is booting
      main.webContents.once('did-finish-load', () => sendCodeToRenderer());
    } else {
      if (!main.isVisible()) {
        main.show();
        main.focus();
      }
      sendCodeToRenderer();
    }
  };
  private webview!: WebviewTag;
  private webContents!: WebContents;

  constructor(private readonly ssoCode: string) {}

  private buildUrl() {
    if (!this.webview.src) {
      return 'about:blank';
    }
    const src = new URL(this.webview.src);
    src.pathname = '/auth/';
    src.hash = `${AutomatedSingleSignOn.SSO_LOGIN_HASH}${this.ssoCode}`;
    return src.href;
  }

  private executeLogin() {
    return new Promise((resolve, reject) => {
      const failedToLoad = () => reject('Webview failed to load');
      this.webview = document.querySelector('.Webview:not(.hide)') as WebviewTag;
      this.webContents = this.webview.getWebContents();

      this.webContents.once('did-fail-load', failedToLoad);
      this.webContents.once('did-finish-load', async () => {
        this.webContents.removeListener('did-fail-load', failedToLoad);
        resolve();
      });

      this.webContents.loadURL(this.buildUrl());
    });
  }

  private async onResponseReceived(event: CustomEvent) {
    try {
      if (event.detail && event.detail.reachedMaximumAccounts) {
        throw new MaximumAccountsReachedError('Maximum account reached');
      }

      await this.executeLogin();
    } catch (error) {
      if (error instanceof MaximumAccountsReachedError) {
        dialog.showMessageBox({
          detail: getText('wrapperAddAccountErrorMessage'),
          message: getText('wrapperAddAccountErrorTitle'),
          type: 'warning',
        });
      }
    }
  }

  public async start() {
    // Send initial signal to the renderer and wait for a response
    window.addEventListener(
      EVENT_TYPE.ACTION.CREATE_ACCOUNT_RESPONSE,
      event => this.onResponseReceived(event as CustomEvent),
      {
        once: true,
      }
    );
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.CREATE_ACCOUNT));
  }
}

export {AutomatedSingleSignOn};

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

import {WebContents, WebviewTag, app, clipboard} from 'electron';
import {URL} from 'url';
const dialog = require('electron').dialog || require('electron').remote.dialog;

import * as windowManager from '../js/window-manager';
import {getText} from '../locale/locale';
import {EVENT_TYPE} from './eventType';

class AutomatedSingleSignOn {
  private static readonly SSO_ACTION_DELAY = 1000;
  private static readonly SSO_CODE_PREFIX = 'wire-';
  private static readonly SSO_LOGIN_HASH = 'login';
  public static readonly clipboard = {
    read: () => clipboard.readText(),
    write: (value: string) => clipboard.writeText(value),
  };
  private static readonly sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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
      }
      sendCodeToRenderer();
    }
  };
  private oldClipboard: string | undefined;
  private webview!: WebviewTag;
  private webContents!: WebContents;

  constructor(private readonly ssoCode: string) {}

  private buildUrl() {
    if (!this.webview.src) {
      return 'about:blank';
    }
    const src = new URL(this.webview.src);
    src.pathname = '/auth/';
    src.hash = AutomatedSingleSignOn.SSO_LOGIN_HASH;
    return src.href;
  }

  private async clickOn(element: string) {
    await this.webContents.executeJavaScript(`document.querySelector('${element}').click();`);
    await AutomatedSingleSignOn.sleep(AutomatedSingleSignOn.SSO_ACTION_DELAY);
  }

  private onResponseReceived(event: CustomEvent) {
    if (event.detail && event.detail.reachedMaximumAccounts) {
      dialog.showMessageBox({
        detail: getText('wrapperAddAccountErrorMessage'),
        message: getText('wrapperAddAccountErrorTitle'),
        type: 'warning',
      });
      return;
    }

    this.webview = document.querySelector('.Webview:not(.hide)') as WebviewTag;
    this.webContents = this.webview.getWebContents();

    this.webContents.once('did-finish-load', async () => {
      await this.clickOn('a[data-uie-name="go-sign-in-sso"]');
      await this.clickOn('button[data-uie-name="do-sso-sign-in"]');
      await this.restoreClipboard();
    });

    this.webContents.loadURL(this.buildUrl());
  }

  public async restoreClipboard() {
    if (this.oldClipboard) {
      await AutomatedSingleSignOn.clipboard.write(this.oldClipboard);
    }
  }

  public async start() {
    this.oldClipboard = AutomatedSingleSignOn.clipboard.read();
    await AutomatedSingleSignOn.clipboard.write(`${AutomatedSingleSignOn.SSO_CODE_PREFIX}${this.ssoCode}`);

    // Send initial signal to the renderer and wait for a response
    window.addEventListener(EVENT_TYPE.ACTION.CREATE_ACCOUNT_RESPONSE, (event: any) => this.onResponseReceived(event), {
      once: true,
    });
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.CREATE_ACCOUNT));
  }
}

export {AutomatedSingleSignOn};

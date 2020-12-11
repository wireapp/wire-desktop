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

import * as Electron from 'electron';
const remote = require('@electron/remote');

import {EVENT_TYPE} from '../lib/eventType';
import {getText} from '../locale/locale';
import {config} from '../settings/config';

export interface CreateSSOAccountDetail {
  reachedMaximumAccounts?: boolean;
}

const dialog = Electron.dialog || remote.dialog;

export class AutomatedSingleSignOn {
  private async showError(): Promise<void> {
    let detail = getText('wrapperAddAccountErrorMessagePlural');
    let message = getText('wrapperAddAccountErrorTitlePlural');

    if (config.maximumAccounts === 1) {
      detail = getText('wrapperAddAccountErrorMessageSingular');
      message = getText('wrapperAddAccountErrorTitleSingular');
    }

    await dialog.showMessageBox({
      detail,
      message,
      type: 'warning',
    });
  }

  public async start(ssoCode: string): Promise<void> {
    window.addEventListener(
      EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE,
      async event => {
        const data = (event as CustomEvent<CreateSSOAccountDetail>).detail;
        if (data?.reachedMaximumAccounts) {
          await this.showError();
        }
      },
      {
        once: true,
      },
    );

    window.dispatchEvent(
      new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT, {
        detail: {
          code: ssoCode,
        },
      }),
    );
  }
}

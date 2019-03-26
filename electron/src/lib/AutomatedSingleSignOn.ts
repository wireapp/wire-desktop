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

import {dialog as mainDialog, remote} from 'electron';
import {getText} from '../locale/locale';
import {MAXIMUM_ACCOUNTS} from '../settings/config';
import {EVENT_TYPE} from './eventType';

const dialog = mainDialog || remote.dialog;

class AutomatedSingleSignOn {
  private onResponseReceived(event: CustomEvent) {
    if (event.detail && event.detail.reachedMaximumAccounts) {
      this.showError();
    }
  }

  private showError() {
    const detail =
      MAXIMUM_ACCOUNTS === 1
        ? getText('wrapperAddAccountErrorMessageSingular')
        : getText('wrapperAddAccountErrorMessagePlural');
    const message =
      MAXIMUM_ACCOUNTS === 1
        ? getText('wrapperAddAccountErrorTitleSingular')
        : getText('wrapperAddAccountErrorTitlePlural');

    dialog.showMessageBox({
      detail,
      message,
      type: 'warning',
    });
  }

  public async start(ssoCode: string) {
    // Send initial signal to the renderer and wait for a response
    window.addEventListener(
      EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE,
      event => this.onResponseReceived(event as CustomEvent),
      {
        once: true,
      }
    );

    window.dispatchEvent(
      new CustomEvent(EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT, {
        detail: {
          code: ssoCode,
        },
      })
    );
  }
}

export {AutomatedSingleSignOn};

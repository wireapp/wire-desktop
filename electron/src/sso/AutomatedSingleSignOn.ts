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
import {EVENT_TYPE} from '../lib/eventType';
import {getText} from '../locale/locale';
import {config} from '../settings/config';
import {CreateSSOAccountDetail} from './CreateSSOAccountDetail';

const dialog = mainDialog || remote.dialog;

class AutomatedSingleSignOn {
  private onResponseReceived(event: CustomEvent<CreateSSOAccountDetail>): void {
    if (event.detail.reachedMaximumAccounts) {
      this.showError();
    }
  }

  private showError(): void {
    let detail = getText('wrapperAddAccountErrorMessagePlural');
    let message = getText('wrapperAddAccountErrorTitlePlural');

    if (config.maximumAccounts === 1) {
      detail = getText('wrapperAddAccountErrorMessageSingular');
      message = getText('wrapperAddAccountErrorTitleSingular');
    }

    dialog.showMessageBox({
      detail,
      message,
      type: 'warning',
    });
  }

  public async start(ssoCode: string): Promise<void> {
    window.addEventListener(
      EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE,
      (event: Event) => {
        if ((event as CustomEvent).detail) {
          this.onResponseReceived(event as CustomEvent);
        }
      },
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

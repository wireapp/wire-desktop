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

import {ipcRenderer} from 'electron';

import {EVENT_TYPE} from '../lib/eventType';
import type {i18nLanguageIdentifier} from '../locale/locale';
import type {config} from '../settings/config';

const locale = {
  getText(stringIdentifier: i18nLanguageIdentifier, paramReplacements?: Record<string, string>): Promise<string> {
    return ipcRenderer.invoke(EVENT_TYPE.IPC.LOCALE, 'getText', stringIdentifier, paramReplacements);
  },
};

const getConfig = (): Promise<typeof config> => {
  return ipcRenderer.invoke(EVENT_TYPE.IPC.CONFIG, 'getConfig');
};

export interface CreateSSOAccountDetail {
  reachedMaximumAccounts?: boolean;
}

export class AutomatedSingleSignOn {
  private async showError(): Promise<void> {
    let message = await locale.getText('wrapperAddAccountErrorMessagePlural');
    let title = await locale.getText('wrapperAddAccountErrorTitlePlural');

    if ((await getConfig()).maximumAccounts === 1) {
      message = await locale.getText('wrapperAddAccountErrorMessageSingular');
      title = await locale.getText('wrapperAddAccountErrorTitleSingular');
    }

    await ipcRenderer.invoke(EVENT_TYPE.IPC.SHOW_DIALOG, message, title, 'warning');
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

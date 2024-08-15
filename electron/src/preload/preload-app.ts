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

import {ipcRenderer, webFrame} from 'electron';
import {truncate} from 'lodash';

import * as path from 'path';

import {WebAppEvents} from '@wireapp/webapp-events';

import {EVENT_TYPE} from '../lib/eventType';
import * as locale from '../locale';
import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import {AutomatedSingleSignOn} from '../sso/AutomatedSingleSignOn';

const logger = getLogger(path.basename(__filename));

webFrame.setVisualZoomLevelLimits(1, 1);

window.locStrings = locale.LANGUAGES[locale.getCurrent()];
window.locStringsDefault = locale.LANGUAGES.en;
window.locale = locale.getCurrent();

window.isMac = EnvironmentUtil.platform.IS_MAC_OS;

const getSelectedWebview = (): Electron.WebviewTag | null =>
  document.querySelector<Electron.WebviewTag>('.Webview:not(.hide)');
const getWebviewById = (id: string): Electron.WebviewTag | null =>
  document.querySelector<Electron.WebviewTag>(`.Webview[data-accountid="${id}"]`);

const subscribeToMainProcessEvents = (): void => {
  ipcRenderer.on(EVENT_TYPE.ACCOUNT.SSO_LOGIN, (_event, code: string) => new AutomatedSingleSignOn().start(code));
  ipcRenderer.on(
    EVENT_TYPE.ACTION.JOIN_CONVERSATION,
    async (_event, {code, key, domain}: {code: string; key: string; domain?: string}) => {
      const selectedWebview = getSelectedWebview();
      if (selectedWebview) {
        await selectedWebview.send(EVENT_TYPE.ACTION.JOIN_CONVERSATION, {code, key, domain});
      }
    },
  );

  ipcRenderer.on(EVENT_TYPE.UI.SYSTEM_MENU, async (_event, action: string) => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      await selectedWebview.send(action);
    }
  });

  ipcRenderer.on(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSED, async () => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      await selectedWebview.send(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSED);
    }
  });

  ipcRenderer.on(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, async (_event, hash: string) => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      await selectedWebview.send(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, hash);
    }
  });

  ipcRenderer.on(EVENT_TYPE.EDIT.COPY, () => getSelectedWebview()?.copy());
  ipcRenderer.on(EVENT_TYPE.EDIT.CUT, () => getSelectedWebview()?.cut());
  ipcRenderer.on(EVENT_TYPE.EDIT.PASTE, () => getSelectedWebview()?.paste());
  ipcRenderer.on(EVENT_TYPE.EDIT.REDO, () => getSelectedWebview()?.redo());
  ipcRenderer.on(EVENT_TYPE.EDIT.SELECT_ALL, () => getSelectedWebview()?.selectAll());
  ipcRenderer.on(EVENT_TYPE.EDIT.UNDO, () => getSelectedWebview()?.undo());

  ipcRenderer.on(EVENT_TYPE.WRAPPER.RELOAD, (): void => {
    const webviews = document.querySelectorAll<Electron.WebviewTag>('webview');
    webviews.forEach(webview => webview.reload());
  });

  ipcRenderer.on(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, (event, accountIndex: number) => {
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex}}));
  });

  ipcRenderer.on(EVENT_TYPE.ACTION.START_LOGIN, event => {
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.START_LOGIN));
  });
};

const setupIpcInterface = (): void => {
  window.sendBadgeCount = (count: number, ignoreFlash: boolean): void => {
    ipcRenderer.send(EVENT_TYPE.UI.BADGE_COUNT, {count, ignoreFlash});
  };

  window.submitDeepLink = (url: string): void => {
    ipcRenderer.send(EVENT_TYPE.ACTION.DEEP_LINK_SUBMIT, url);
  };

  window.sendDeleteAccount = (accountId: string, sessionID?: string): Promise<void> => {
    const truncatedId = truncate(accountId, {length: 5});

    return new Promise((resolve, reject) => {
      const accountWebview = getWebviewById(accountId);
      if (!accountWebview) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return reject(`Webview for account "${truncatedId}" does not exist`);
      }

      logger.info(`Processing deletion of "${truncatedId}"`);
      const viewInstanceId = accountWebview.getWebContentsId();
      ipcRenderer.on(EVENT_TYPE.ACCOUNT.DATA_DELETED, () => resolve());
      ipcRenderer.send(EVENT_TYPE.ACCOUNT.DELETE_DATA, viewInstanceId, accountId, sessionID);
    });
  };

  window.sendLogoutAccount = async (accountId: string): Promise<void> => {
    const accountWebview = getWebviewById(accountId);
    logger.log(`Sending logout signal to webview for account "${truncate(accountId, {length: 5})}".`);
    await accountWebview?.send(EVENT_TYPE.ACTION.SIGN_OUT);
  };

  window.sendConversationJoinToHost = async (
    accountId: string,
    code: string,
    key: string,
    domain?: string,
  ): Promise<void> => {
    const accountWebview = getWebviewById(accountId);
    logger.log(`Sending conversation join data to webview for account "${truncate(accountId, {length: 5})}".`);
    await accountWebview?.send(WebAppEvents.CONVERSATION.JOIN, {code, key, domain});
  };
};

setupIpcInterface();
subscribeToMainProcessEvents();

window.addEventListener('focus', () => {
  const selectedWebview = getSelectedWebview();
  if (selectedWebview) {
    selectedWebview.blur();
    selectedWebview.focus();
  }
});

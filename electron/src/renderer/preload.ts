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

import {IpcMessageEvent, WebviewTag, ipcRenderer, webFrame} from 'electron';
import * as environment from '../js/environment';
import {getLogger} from '../js/getLogger';
import {AutomatedSingleSignOn} from '../lib/AutomatedSingleSignOn';
import {EVENT_TYPE} from '../lib/eventType';
import * as locale from '../locale/locale';

const logger = getLogger('preload');

webFrame.setZoomFactor(1.0);
webFrame.setVisualZoomLevelLimits(1, 1);

window.locStrings = locale.LANGUAGES[locale.getCurrent()];
window.locStringsDefault = locale.LANGUAGES.en;

window.isMac = environment.platform.IS_MAC_OS;

const getSelectedWebview = (): WebviewTag => document.querySelector('.Webview:not(.hide)') as WebviewTag;
const getWebviewById = (id: string): WebviewTag => {
  return document.querySelector(`.Webview[data-accountid="${id}"]`) as WebviewTag;
};

const subscribeToMainProcessEvents = () => {
  ipcRenderer.on(EVENT_TYPE.ACCOUNT.SSO_LOGIN, (event: IpcMessageEvent, code: string) =>
    new AutomatedSingleSignOn(code).start()
  );

  ipcRenderer.on(EVENT_TYPE.UI.SYSTEM_MENU, (event: IpcMessageEvent, action: string) => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      selectedWebview.send(action);
    }
  });

  ipcRenderer.on(
    EVENT_TYPE.WRAPPER.RELOAD,
    (): void => {
      const webviews = document.querySelectorAll<WebviewTag>('webview');
      webviews.forEach(webview => webview.reload());
    }
  );
};

const setupIpcInterface = (): void => {
  window.sendBadgeCount = (count: number): void => {
    ipcRenderer.send(EVENT_TYPE.UI.BADGE_COUNT, count);
  };

  window.sendDeleteAccount = (accountID: string, sessionID?: string) => {
    return new Promise((resolve, reject) => {
      const accountWebview = getWebviewById(accountID);
      if (!accountWebview) {
        return reject(`Webview for account "${accountID}" does not exist`);
      }

      console.log(`Processing deletion of "${accountID}"`);
      const viewInstanceId = accountWebview.getWebContents().id;
      ipcRenderer.on(EVENT_TYPE.ACCOUNT.DATA_DELETED, () => resolve());
      ipcRenderer.send(EVENT_TYPE.ACCOUNT.DELETE_DATA, viewInstanceId, accountID, sessionID);
    });
  };

  window.sendLogoutAccount = (accountId: string): void => {
    const accountWebview = getWebviewById(accountId);
    if (accountWebview) {
      logger.log(`Sending logout signal to webview for account "${accountId}".`);
      accountWebview.send(EVENT_TYPE.ACTION.SIGN_OUT);
    }
  };
};

const addDragRegion = (): void => {
  if (environment.platform.IS_MAC_OS) {
    // add title bar ghost to prevent interactions with the content while dragging
    const titleBar = document.createElement('div');
    titleBar.className = 'drag-region';
    document.body.appendChild(titleBar);
  }
};

setupIpcInterface();
subscribeToMainProcessEvents();

ipcRenderer.on(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, (event: CustomEvent, accountIndex: number) => {
  window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex}}));
});

window.addEventListener('DOMContentLoaded', addDragRegion);

window.addEventListener('focus', () => {
  const selectedWebview = getSelectedWebview();
  if (selectedWebview) {
    selectedWebview.focus();
  }
});

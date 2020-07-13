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

import {ipcRenderer, webFrame, WebviewTag} from 'electron';
import * as path from 'path';

import {EVENT_TYPE} from '../lib/eventType';
import * as locale from '../locale/locale';
import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import {AutomatedSingleSignOn} from '../sso/AutomatedSingleSignOn';

const logger = getLogger(path.basename(__filename));

webFrame.setZoomFactor(1.0);
webFrame.setVisualZoomLevelLimits(1, 1);

window.locStrings = locale.LANGUAGES[locale.getCurrent()];
window.locStringsDefault = locale.LANGUAGES.en;

window.isMac = EnvironmentUtil.platform.IS_MAC_OS;

const getSelectedWebview = (): WebviewTag | null => document.querySelector<WebviewTag>('.Webview:not(.hide)');
const getWebviewById = (id: string): WebviewTag | null =>
  document.querySelector<WebviewTag>(`.Webview[data-accountid="${id}"]`);

const subscribeToMainProcessEvents = (): void => {
  ipcRenderer.on(EVENT_TYPE.ACCOUNT.SSO_LOGIN, (_event, code: string) => new AutomatedSingleSignOn().start(code));

  ipcRenderer.on(EVENT_TYPE.UI.SYSTEM_MENU, async (_event, action: string) => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      await selectedWebview.send(action);
    }
  });

  ipcRenderer.on(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, async (_event, hash: string) => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      await selectedWebview.send(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, hash);
    }
  });

  ipcRenderer.on(EVENT_TYPE.EDIT.REDO, () => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      selectedWebview.redo();
    }
  });

  ipcRenderer.on(EVENT_TYPE.EDIT.UNDO, () => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      selectedWebview.undo();
    }
  });

  ipcRenderer.on(EVENT_TYPE.WRAPPER.RELOAD, (): void => {
    const webviews = document.querySelectorAll<WebviewTag>('webview');
    webviews.forEach(webview => webview.reload());
  });

  ipcRenderer.on(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, (event, accountIndex: number) => {
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex}}));
  });
};

const setupIpcInterface = (): void => {
  window.sendBadgeCount = (count: number): void => {
    ipcRenderer.send(EVENT_TYPE.UI.BADGE_COUNT, count);
  };

  window.sendDeleteAccount = (accountID: string, sessionID?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const accountWebview = getWebviewById(accountID);
      if (!accountWebview) {
        // eslint-disable-next-line
        return reject(`Webview for account "${accountID}" does not exist`);
      }

      logger.info(`Processing deletion of "${accountID}"`);
      const viewInstanceId = accountWebview.getWebContentsId();
      ipcRenderer.on(EVENT_TYPE.ACCOUNT.DATA_DELETED, () => resolve());
      ipcRenderer.send(EVENT_TYPE.ACCOUNT.DELETE_DATA, viewInstanceId, accountID, sessionID);
    });
  };

  window.sendLogoutAccount = async (accountId: string): Promise<void> => {
    const accountWebview = getWebviewById(accountId);
    if (accountWebview) {
      logger.log(`Sending logout signal to webview for account "${accountId}".`);
      await accountWebview.send(EVENT_TYPE.ACTION.SIGN_OUT);
    }
  };
};

const addDragRegion = (): void => {
  if (EnvironmentUtil.platform.IS_MAC_OS) {
    // add title bar ghost to prevent interactions with the content while dragging
    const titleBar = document.createElement('div');
    titleBar.className = 'drag-region';
    document.body.appendChild(titleBar);
  }
};

setupIpcInterface();
subscribeToMainProcessEvents();

window.addEventListener('DOMContentLoaded', addDragRegion);
window.addEventListener('focus', () => {
  const selectedWebview = getSelectedWebview();
  if (selectedWebview) {
    selectedWebview.blur();
    selectedWebview.focus();
  }
});

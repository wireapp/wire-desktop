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

import {WebviewTag, ipcRenderer, webFrame} from 'electron';
import * as locale from '../locale/locale';
import * as environment from './environment';
import {EVENT_TYPE} from './lib/eventType';

declare var window: any;

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
  ipcRenderer.on(EVENT_TYPE.UI.SYSTEM_MENU, (event: Event, action: string) => {
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
  window.sendBadgeCount = (count: number) => {
    ipcRenderer.send(EVENT_TYPE.UI.BADGE_COUNT, count);
  };

  window.sendDeleteAccount = (accountID: string, sessionID: string) => {
    const accountWebview = getWebviewById(accountID);
    accountWebview.getWebContents().session.clearStorageData();
    ipcRenderer.send(EVENT_TYPE.ACCOUNT.DELETE_DATA, accountID, sessionID);
  };

  window.sendLogoutAccount = (accountId: string) => {
    const accountWebview = getWebviewById(accountId);
    if (accountWebview) {
      accountWebview.send(EVENT_TYPE.ACTION.SIGN_OUT);
    }
  };
};

const addDragRegion = (): void => {
  if (environment.platform.IS_MAC_OS) {
    // add titlebar ghost to prevent interactions with the content while dragging
    const titleBar = document.createElement('div');
    titleBar.className = 'drag-region';
    document.body.appendChild(titleBar);
  }
};

setupIpcInterface();
subscribeToMainProcessEvents();

window.addEventListener('DOMContentLoaded', () => {
  addDragRegion();
});

window.addEventListener('focus', () => {
  const selectedWebview = getSelectedWebview();
  if (selectedWebview) {
    selectedWebview.focus();
  }
});

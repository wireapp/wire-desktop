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
import type {SupportedI18nLanguage, SupportedI18nLanguageObject} from '../locale/locale';
import type {platform} from '../runtime/EnvironmentUtil';

const logger = {
  error: (...logs: string[]) => ipcRenderer.invoke(EVENT_TYPE.IPC.LOG, 'error', path.basename(__filename), logs),
  info: (...logs: string[]) => ipcRenderer.invoke(EVENT_TYPE.IPC.LOG, 'info', path.basename(__filename), logs),
  log: (...logs: string[]) => ipcRenderer.invoke(EVENT_TYPE.IPC.LOG, 'log', path.basename(__filename), logs),
  warn: (...logs: string[]) => ipcRenderer.invoke(EVENT_TYPE.IPC.LOG, 'warn', path.basename(__filename), logs),
};

const locale = {
  getCurrent(): Promise<SupportedI18nLanguage> {
    return ipcRenderer.invoke(EVENT_TYPE.IPC.LOCALE, 'getCurrent');
  },
  getLANGUAGES(): Promise<SupportedI18nLanguageObject> {
    return ipcRenderer.invoke(EVENT_TYPE.IPC.LOCALE, 'getLanguages');
  },
};

const EnvironmentUtil = {
  getPlatform: (): Promise<typeof platform> => ipcRenderer.invoke(EVENT_TYPE.IPC.ENVIRONMENTUTIL, 'getPlatform'),
};

webFrame.setVisualZoomLevelLimits(1, 1);

void (async () => {
  const LANGUAGES = await locale.getLANGUAGES();
  const currentLanguage = await locale.getCurrent();
  const envUtilPlatform = await EnvironmentUtil.getPlatform();

  window.locStrings = LANGUAGES[currentLanguage];
  window.locStringsDefault = LANGUAGES.en;
  window.locale = currentLanguage;
  window.isMac = envUtilPlatform.IS_MAC_OS;

  const getSelectedWebview = (): WebviewTag | null => {
    return document.querySelector<WebviewTag>('.Webview:not(.hide)');
  };
  const getWebviewById = (id: string): WebviewTag | null => {
    return document.querySelector<WebviewTag>(`.Webview[data-accountid="${id}"]`);
  };

  const subscribeToMainProcessEvents = (): void => {
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

    ipcRenderer.on(EVENT_TYPE.EDIT.COPY, () => getSelectedWebview()?.copy());
    ipcRenderer.on(EVENT_TYPE.EDIT.CUT, () => getSelectedWebview()?.cut());
    ipcRenderer.on(EVENT_TYPE.EDIT.PASTE, () => getSelectedWebview()?.paste());
    ipcRenderer.on(EVENT_TYPE.EDIT.REDO, () => getSelectedWebview()?.redo());
    ipcRenderer.on(EVENT_TYPE.EDIT.SELECT_ALL, () => getSelectedWebview()?.selectAll());
    ipcRenderer.on(EVENT_TYPE.EDIT.UNDO, () => getSelectedWebview()?.undo());

    ipcRenderer.on(EVENT_TYPE.WRAPPER.RELOAD, (): void => {
      const webviews = document.querySelectorAll<WebviewTag>('webview');
      webviews.forEach(webview => webview.reload());
    });

    ipcRenderer.on(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, (_event, accountIndex: number) => {
      window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex}}));
    });
  };

  const setupIpcInterface = (): void => {
    window.sendBadgeCount = (count: number, ignoreFlash: boolean): void => {
      ipcRenderer.send(EVENT_TYPE.UI.BADGE_COUNT, {count, ignoreFlash});
    };

    window.submitDeepLink = (url: string): void => {
      ipcRenderer.send(EVENT_TYPE.ACTION.DEEP_LINK_SUBMIT, url);
    };

    window.sendDeleteAccount = async (accountID: string, sessionID?: string): Promise<void> => {
      const accountWebview = getWebviewById(accountID);
      if (!accountWebview) {
        throw new Error(`Webview for account "${accountID}" does not exist`);
      }

      await logger.info(`Processing deletion of "${accountID}"`);
      const viewInstanceId = accountWebview.getWebContentsId();

      await ipcRenderer.invoke(EVENT_TYPE.ACCOUNT.DELETE_DATA, viewInstanceId, accountID, sessionID);
    };

    window.sendLogoutAccount = async (accountId: string): Promise<void> => {
      const accountWebview = getWebviewById(accountId);
      if (accountWebview) {
        await logger.log(`Sending logout signal to webview for account "${accountId}".`);
        await accountWebview.send(EVENT_TYPE.ACTION.SIGN_OUT);
      }
    };
  };

  const addDragRegion = (): void => {
    if (envUtilPlatform.IS_MAC_OS) {
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
})();

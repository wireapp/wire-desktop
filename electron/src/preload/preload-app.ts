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

import {EVENT_TYPE} from '../lib/eventType';
import {getLogger} from '../logging/getLoggerRenderer';
import {AutomatedSingleSignOn} from '../sso/AutomatedSingleSignOn';

const logger = getLogger('preload-app');

webFrame.setZoomFactor(1.0);
webFrame.setVisualZoomLevelLimits(1, 1);

void (async () => {
  try {
    const locStrings = await ipcRenderer.invoke('LOCALE_GET_LANGUAGE_STRINGS');
    const locStringsEnglish = await ipcRenderer.invoke('LOCALE_GET_ENGLISH_STRINGS');

    window.locStrings = locStrings;
    window.locStringsDefault = locStringsEnglish;

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

      ipcRenderer.on(EVENT_TYPE.WRAPPER.ZOOM_IN, () => {
        logger.info(`Received event "${EVENT_TYPE.WRAPPER.ZOOM_IN}", zooming in ...`);
        const currentZoomFactor = webFrame.getZoomFactor();
        const newZoomFactor = Math.min(currentZoomFactor + 0.1, 2.0);
        webFrame.setZoomFactor(newZoomFactor);
      });

      ipcRenderer.on(EVENT_TYPE.WRAPPER.ZOOM_OUT, () => {
        logger.info(`Received event "${EVENT_TYPE.WRAPPER.ZOOM_OUT}", zooming out ...`);
        const currentZoomFactor = webFrame.getZoomFactor();
        const newZoomFactor = Math.max(currentZoomFactor - 0.1, 0.5);
        webFrame.setZoomFactor(newZoomFactor);
      });

      ipcRenderer.on(EVENT_TYPE.WRAPPER.ZOOM_RESET, () => {
        logger.info(`Received event "${EVENT_TYPE.WRAPPER.ZOOM_RESET}", resetting zoom ...`);
        webFrame.setZoomFactor(1.0);
      });
    };

    const setupIpcInterface = (): void => {
      window.sendBadgeCount = (count: number, ignoreFlash: boolean): void => {
        ipcRenderer.send(EVENT_TYPE.UI.BADGE_COUNT, {count, ignoreFlash});
      };

      window.submitDeepLink = (url: string): void => {
        ipcRenderer.send(EVENT_TYPE.ACTION.DEEP_LINK_SUBMIT, url);
      };

      window.sendDeleteAccount = (accountID: string, sessionID?: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const accountWebview = getWebviewById(accountID);
          if (!accountWebview) {
            // eslint-disable-next-line prefer-promise-reject-errors
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

    const addDragRegion = async (): Promise<void> => {
      const isMac = await ipcRenderer.invoke('ENV_GET_IS_MAC_OS');
      if (isMac) {
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
  } catch (error) {
    logger.error(error);
  }
})();

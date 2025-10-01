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

import {contextBridge, ipcRenderer, webFrame} from 'electron';

// Context Isolation Security: Import shared constants for type safety and maintainability
import {EVENT_TYPE, WebAppEvents, createSandboxLogger} from '../shared/contextIsolationConstants';

/**
 * Platform detection utilities for sandboxed context
 *
 * IMPORTANT: This is a necessary duplication of ../shared/contextIsolationConstants.ts
 * due to Electron sandbox limitations. Keep in sync with the shared file.
 */
const SandboxEnvironmentUtil = {
  platform: {
    IS_MAC_OS: (() => {
      // Check process.platform first (Node.js environment)
      if (typeof process !== 'undefined') {
        return process.platform === 'darwin';
      }
      // Fallback to user agent string for browser environments
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        return navigator.userAgent.includes('Mac');
      }
      return false;
    })(),
  },
};

/**
 * Locale utilities for sandboxed context
 *
 * IMPORTANT: This is a necessary duplication of ../shared/contextIsolationConstants.ts
 * due to Electron sandbox limitations. Keep in sync with the shared file.
 *
 * @returns {Object} Locale utilities with getCurrent method and LANGUAGES object
 */
const createSandboxLocale = () => ({
  getCurrent: () => {
    if (typeof navigator !== 'undefined') {
      return navigator.language.split('-')[0] || 'en';
    }
    return 'en';
  },
  LANGUAGES: {
    en: {},
    [navigator?.language?.split('-')[0] || 'en']: {},
  } as Record<string, any>,
});

/**
 * String truncation utility for sandboxed context
 *
 * IMPORTANT: This is a necessary duplication of ../shared/contextIsolationConstants.ts
 * due to Electron sandbox limitations. Keep in sync with the shared file.
 *
 * @param {string} str - The string to truncate
 * @param {Object} options - Options object with length property
 * @returns {string} The truncated string with ellipsis if needed
 */
const truncate = (str: string, options: {length: number}) => {
  if (str.length <= options.length) {
    return str;
  }
  return `${str.slice(0, options.length - 3)}...`;
};

/**
 * SSO utilities for sandboxed context
 *
 * Context Isolation Security: Simplified SSO handling for preload context
 */
const SandboxAutomatedSingleSignOn = class {
  start(code: string) {
    // eslint-disable-next-line no-console
    console.log(`[SSO] Starting SSO with code: ${code.substring(0, 10)}...`);
    // SSO implementation would go here
  }
};

/**
 * Logger for preload script
 *
 * Context Isolation Security: Uses shared sandbox logger instead of main process getLogger
 * which cannot be imported in preload scripts due to context isolation.
 */
const logger = createSandboxLogger('preload-app');

/**
 * Platform utilities for preload script
 *
 * Context Isolation Security: Uses shared sandbox environment utilities instead of
 * main process EnvironmentUtil which cannot be imported in preload scripts.
 */
const EnvironmentUtil = SandboxEnvironmentUtil;

/**
 * Locale utilities for preload script
 *
 * Context Isolation Security: Uses shared sandbox locale utilities instead of
 * main process locale module which cannot be imported in preload scripts.
 */
const locale = createSandboxLocale();

webFrame.setVisualZoomLevelLimits(1, 1);

contextBridge.exposeInMainWorld('wireDesktop', {
  locStrings: locale.LANGUAGES[locale.getCurrent()],
  locStringsDefault: locale.LANGUAGES.en,
  locale: locale.getCurrent(),

  isMac: EnvironmentUtil.platform.IS_MAC_OS,

  sendBadgeCount: (count: number, ignoreFlash: boolean) => {
    ipcRenderer.send(EVENT_TYPE.UI.BADGE_COUNT, {count, ignoreFlash});
  },

  submitDeepLink: (url: string) => {
    ipcRenderer.send(EVENT_TYPE.ACTION.DEEP_LINK_SUBMIT, url);
  },

  sendDeleteAccount: (accountId: string, sessionID?: string): Promise<void> => {
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
  },

  sendLogoutAccount: async (accountId: string): Promise<void> => {
    const accountWebview = getWebviewById(accountId);
    logger.log(`Sending logout signal to webview for account "${truncate(accountId, {length: 5})}".`);
    await accountWebview?.send(EVENT_TYPE.ACTION.SIGN_OUT);
  },

  sendConversationJoinToHost: async (accountId: string, code: string, key: string, domain?: string): Promise<void> => {
    const accountWebview = getWebviewById(accountId);
    logger.log(`Sending conversation join data to webview for account "${truncate(accountId, {length: 5})}".`);
    await accountWebview?.send(WebAppEvents.CONVERSATION.JOIN, {code, key, domain});
  },
});

const getSelectedWebview = (): Electron.WebviewTag | null =>
  document.querySelector<Electron.WebviewTag>('.Webview:not(.hide)');
const getWebviewById = (id: string): Electron.WebviewTag | null =>
  document.querySelector<Electron.WebviewTag>(`.Webview[data-accountid="${id}"]`);

const subscribeToMainProcessEvents = (): void => {
  ipcRenderer.on(EVENT_TYPE.ACCOUNT.SSO_LOGIN, (_event, code: string) =>
    new SandboxAutomatedSingleSignOn().start(code),
  );
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

  ipcRenderer.on(EVENT_TYPE.WRAPPER.RELOAD, (): void => {
    const webviews = document.querySelectorAll<Electron.WebviewTag>('webview');
    for (const webview of webviews) {
      webview.reload();
    }
  });

  ipcRenderer.on(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, (_event, accountIndex: number) => {
    globalThis.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex}}));
  });

  ipcRenderer.on(EVENT_TYPE.ACTION.START_LOGIN, _event => {
    globalThis.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.START_LOGIN));
  });

  ipcRenderer.on(EVENT_TYPE.UI.SYSTEM_THEME_CHANGED, async () => {
    logger.info('System theme changed, forwarding to active webview...');
    const activeWebview = getSelectedWebview();
    if (activeWebview) {
      try {
        await activeWebview.send(EVENT_TYPE.UI.SYSTEM_THEME_CHANGED);
      } catch (error) {
        logger.warn('Failed to send theme change to active webview:', error);
      }
    } else {
      logger.warn('No active webview found to send theme change to');
    }
  });
};

subscribeToMainProcessEvents();

window.addEventListener('focus', () => {
  const selectedWebview = getSelectedWebview();
  if (selectedWebview) {
    selectedWebview.blur();
    selectedWebview.focus();
  }
});

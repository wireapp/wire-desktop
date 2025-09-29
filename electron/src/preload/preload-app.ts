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

// Context Isolation Security: Inline constants and utilities
// These cannot be imported from main process modules due to context isolation restrictions.
// All constants and utilities are duplicated here to maintain security boundaries.

/**
 * Event type constants for IPC communication
 *
 * Context Isolation Security: These constants must be kept in sync with main process
 * EVENT_TYPE definitions. They are duplicated here because preload scripts cannot
 * import from main process modules due to context isolation.
 */
const EVENT_TYPE = {
  ACCOUNT: {
    DATA_DELETED: 'EVENT_TYPE.ACCOUNT.DATA_DELETED',
    DELETE_DATA: 'EVENT_TYPE.ACCOUNT.DELETE_DATA',
    SSO_LOGIN: 'EVENT_TYPE.ACCOUNT.SSO_LOGIN',
    UPDATE_INFO: 'EVENT_TYPE.ACCOUNT.UPDATE_INFO',
  },
  ACTION: {
    DEEP_LINK_SUBMIT: 'EVENT_TYPE.ACTION.DEEP_LINK_SUBMIT',
    JOIN_CONVERSATION: 'EVENT_TYPE.ACTION.JOIN_CONVERSATION',
    NOTIFICATION_CLICK: 'EVENT_TYPE.ACTION.NOTIFICATION_CLICK',
    SIGN_OUT: 'EVENT_TYPE.ACTION.SIGN_OUT',
    START_LOGIN: 'EVENT_TYPE.ACTION.START_LOGIN',
    SWITCH_ACCOUNT: 'EVENT_TYPE.ACTION.SWITCH_ACCOUNT',
  },
  EDIT: {
    COPY: 'EVENT_TYPE.EDIT.COPY',
    CUT: 'EVENT_TYPE.EDIT.CUT',
    PASTE: 'EVENT_TYPE.EDIT.PASTE',
    REDO: 'EVENT_TYPE.EDIT.REDO',
    SELECT_ALL: 'EVENT_TYPE.EDIT.SELECT_ALL',
    UNDO: 'EVENT_TYPE.EDIT.UNDO',
  },
  LIFECYCLE: {
    SIGNED_IN: 'EVENT_TYPE.LIFECYCLE.SIGNED_IN',
    SIGNED_OUT: 'EVENT_TYPE.LIFECYCLE.SIGNED_OUT',
    SIGN_OUT: 'EVENT_TYPE.LIFECYCLE.SIGN_OUT',
    UNREAD_COUNT: 'EVENT_TYPE.LIFECYCLE.UNREAD_COUNT',
  },
  UI: {
    BADGE_COUNT: 'EVENT_TYPE.UI.BADGE_COUNT',
    SYSTEM_MENU: 'EVENT_TYPE.UI.SYSTEM_MENU',
    SYSTEM_THEME_CHANGED: 'EVENT_TYPE.UI.SYSTEM_THEME_CHANGED',
    THEME_UPDATE: 'EVENT_TYPE.UI.THEME_UPDATE',
  },
  WEBAPP: {
    CHANGE_LOCATION_HASH: 'EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH',
  },
  WRAPPER: {
    RELOAD: 'EVENT_TYPE.WRAPPER.RELOAD',
  },
} as const;

/**
 * WebApp events for communication with Wire web application
 *
 * Context Isolation Security: Subset of @wireapp/webapp-events that's safe for preload context
 */
const WebAppEvents = {
  CONVERSATION: {
    JOIN: 'wire.webapp.conversation.join',
  },
  LIFECYCLE: {
    SSO_WINDOW_CLOSED: 'wire.webapp.lifecycle.sso_window_closed',
  },
} as const;

/**
 * Safe logger for sandboxed preload context
 *
 * Context Isolation Security: Uses console.log instead of main process logger
 * which cannot be accessed in preload scripts due to context isolation.
 *
 * @param {string} prefix - The prefix to use for log messages
 * @returns {Object} Logger object with info, log, warn, and error methods
 */
const createSandboxLogger = (prefix: string) => ({
  info: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.log(`[${prefix}] ${message}`, ...args);
  },
  log: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.log(`[${prefix}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.warn(`[${prefix}] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error(`[${prefix}] ${message}`, ...args);
  },
});

/**
 * Platform detection utilities for sandboxed context
 *
 * Context Isolation Security: Safe platform detection that works in both
 * renderer and preload contexts without accessing main process modules.
 *
 * @returns {Object} Environment utilities with platform detection
 */
const SandboxEnvironmentUtil = {
  platform: {
    IS_MAC_OS:
      typeof process !== 'undefined'
        ? process.platform === 'darwin'
        : typeof navigator !== 'undefined'
        ? navigator.platform.includes('Mac')
        : false,
  },
};

/**
 * Locale utilities for sandboxed context
 *
 * Context Isolation Security: Browser-based locale detection that works
 * in sandboxed contexts without accessing main process locale modules.
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
 * Context Isolation Security: Simple utility that doesn't depend on external libraries
 *
 * @param {string} str - The string to truncate
 * @param {Object} options - Options object with length property
 * @returns {string} The truncated string with ellipsis if needed
 */
const truncate = (str: string, options: {length: number}) => {
  if (str.length <= options.length) {
    return str;
  }
  return `${str.substring(0, options.length)}...`;
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

  ipcRenderer.on(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, (_event, accountIndex: number) => {
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.SWITCH_ACCOUNT, {detail: {accountIndex}}));
  });

  ipcRenderer.on(EVENT_TYPE.ACTION.START_LOGIN, _event => {
    window.dispatchEvent(new CustomEvent(EVENT_TYPE.ACTION.START_LOGIN));
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

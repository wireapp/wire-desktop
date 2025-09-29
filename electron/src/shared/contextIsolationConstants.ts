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

/**
 * Shared Context Isolation Constants
 *
 * This file contains constants and utilities that are shared between renderer and preload
 * processes due to context isolation security requirements. With context isolation enabled,
 * these processes cannot directly import modules from the main process, so we need to
 * redefine these constants locally.
 *
 * Security Context: These constants are safe to duplicate because they are just string
 * literals that define event types and logging interfaces. No sensitive functionality
 * is exposed.
 *
 * IMPORTANT: These constants must be kept in sync with their main process counterparts:
 * - EVENT_TYPE must match electron/src/lib/eventType.ts
 * - WebAppEvents must match @wireapp/webapp-events
 */

/**
 * Event type constants for IPC communication between main and renderer/preload processes.
 * These must match the constants in electron/src/lib/eventType.ts exactly.
 *
 * Context Isolation Security: Due to context isolation, we cannot import the main process
 * eventType module directly in renderer/preload, so we maintain this synchronized copy.
 */
// NOSONAR - Duplication required for context isolation, must be kept in sync with main process
export const EVENT_TYPE = {
  ACCOUNT: {
    DATA_DELETED: 'EVENT_TYPE.ACCOUNT.DATA_DELETED',
    DELETE_DATA: 'EVENT_TYPE.ACCOUNT.DELETE_DATA',
    SSO_LOGIN: 'EVENT_TYPE.ACCOUNT.SSO_LOGIN',
    UPDATE_INFO: 'EVENT_TYPE.ACCOUNT.UPDATE_INFO',
  },
  ACTION: {
    CHANGE_DOWNLOAD_LOCATION: 'EVENT_TYPE.ACTION.CHANGE_DOWNLOAD_LOCATION',
    DECRYPT: 'EVENT_TYPE.ACTION.DECRYPT',
    DEEP_LINK_SUBMIT: 'EVENT_TYPE.ACTION.DEEP_LINK_SUBMIT',
    ENCRYPT: 'EVENT_TYPE.ACTION.ENCRYPT',
    GET_DESKTOP_SOURCES: 'EVENT_TYPE.ACTION.GET_DESKTOP_SOURCES',
    GET_OG_DATA: 'EVENT_TYPE.ACTION.GET_OG_DATA',
    JOIN_CONVERSATION: 'EVENT_TYPE.ACTION.JOIN_CONVERSATION',
    NOTIFICATION_CLICK: 'EVENT_TYPE.ACTION.NOTIFICATION_CLICK',
    SIGN_OUT: 'EVENT_TYPE.ACTION.SIGN_OUT',
    START_LOGIN: 'EVENT_TYPE.ACTION.START_LOGIN',
    SWITCH_ACCOUNT: 'EVENT_TYPE.ACTION.SWITCH_ACCOUNT',
  },
  CONTEXT_MENU: {
    COPY_TEXT: 'EVENT_TYPE.CONTEXT_MENU.COPY_TEXT',
    COPY_IMAGE: 'EVENT_TYPE.CONTEXT_MENU.COPY_IMAGE',
    SAVE_IMAGE: 'EVENT_TYPE.CONTEXT_MENU.SAVE_IMAGE',
    REPLACE_MISSPELLING: 'EVENT_TYPE.CONTEXT_MENU.REPLACE_MISSPELLING',
  },
  CONVERSATION: {
    ADD_PEOPLE: 'EVENT_TYPE.CONVERSATION.ADD_PEOPLE',
    ARCHIVE: 'EVENT_TYPE.CONVERSATION.ARCHIVE',
    CALL: 'EVENT_TYPE.CONVERSATION.CALL',
    DELETE: 'EVENT_TYPE.CONVERSATION.DELETE',
    PEOPLE: 'EVENT_TYPE.CONVERSATION.PEOPLE',
    PING: 'EVENT_TYPE.CONVERSATION.PING',
    SEARCH: 'EVENT_TYPE.CONVERSATION.SEARCH',
    SHOW_NEXT: 'EVENT_TYPE.CONVERSATION.SHOW_NEXT',
    SHOW_PREVIOUS: 'EVENT_TYPE.CONVERSATION.SHOW_PREVIOUS',
    START: 'EVENT_TYPE.CONVERSATION.START',
    TOGGLE_MUTE: 'EVENT_TYPE.CONVERSATION.TOGGLE_MUTE',
    VIDEO_CALL: 'EVENT_TYPE.CONVERSATION.VIDEO_CALL',
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
  PREFERENCES: {
    SHOW: 'EVENT_TYPE.PREFERENCES.SHOW',
  },
  UI: {
    BADGE_COUNT: 'EVENT_TYPE.UI.BADGE_COUNT',
    SHOULD_USE_DARK_COLORS: 'EVENT_TYPE.UI.SHOULD_USE_DARK_COLORS',
    SYSTEM_MENU: 'EVENT_TYPE.UI.SYSTEM_MENU',
    SYSTEM_THEME_CHANGED: 'EVENT_TYPE.UI.SYSTEM_THEME_CHANGED',
    THEME_UPDATE: 'EVENT_TYPE.UI.THEME_UPDATE',
    WEBAPP_VERSION: 'EVENT_TYPE.UI.WEBAPP_VERSION',
    WEBAPP_AVS_VERSION: 'EVENT_TYPE.UI.WEBAPP_AVS_VERSION',
  },
  WEBAPP: {
    APP_LOADED: 'EVENT_TYPE.WEBAPP.APP_LOADED',
    CHANGE_LOCATION_HASH: 'EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH',
  },
  WRAPPER: {
    NAVIGATE_WEBVIEW: 'EVENT_TYPE.WRAPPER.NAVIGATE_WEBVIEW',
    RELAUNCH: 'EVENT_TYPE.WRAPPER.RELAUNCH',
    RELOAD: 'EVENT_TYPE.WRAPPER.RELOAD',
    UPDATE_AVAILABLE: 'EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE',
  },
} as const;

/**
 * WebApp events constants for communication with the webapp.
 * These must match the constants from @wireapp/webapp-events.
 *
 * Context Isolation Security: Due to context isolation, external modules may not be
 * available in all renderer/preload contexts, so we maintain this local copy.
 */
export const WebAppEvents = {
  CONVERSATION: {
    JOIN: 'wire.webapp.conversation.join',
  },
  LIFECYCLE: {
    SSO_WINDOW_CLOSED: 'wire.webapp.lifecycle.sso_window_closed',
  },
} as const;

/**
 * Simple logger interface for renderer and preload processes.
 *
 * Context Isolation Security: The main process logger (getLogger) cannot be imported
 * in renderer/preload due to context isolation. This provides a safe, sandboxed logging
 * interface that uses console methods which are available in these contexts.
 *
 * @param {string} name - The logger name/context for identifying log sources
 * @returns {Object} Logger interface with info, log, warn, and error methods
 */
// NOSONAR - Duplication required for sandboxed context isolation
export const createSandboxLogger = (name: string) => ({
  info: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.info(`[${name}] ${message}`, ...args);
  },
  log: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.log(`[${name}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.warn(`[${name}] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error(`[${name}] ${message}`, ...args);
  },
});

/**
 * Platform detection utilities for renderer and preload processes.
 *
 * Context Isolation Security: Main process environment utilities cannot be imported
 * in renderer/preload. The process object may not be available in renderer context,
 * so we provide safe platform detection that works in both contexts.
 *
 * @returns {Object} Environment utilities with platform detection
 */
export const SandboxEnvironmentUtil = {
  platform: {
    // Safe platform detection that works in both renderer and preload contexts
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
} as const;

/**
 * Simple locale implementation for renderer and preload processes.
 *
 * Context Isolation Security: Main process locale module cannot be imported
 * in renderer/preload, so we provide this safe locale detection.
 *
 * @returns {Object} Locale utilities with getCurrentLocale function and LANGUAGES object
 */
export const createSandboxLocale = () => {
  const getCurrentLocale = (): string => {
    try {
      // Safe locale detection that works in both renderer and preload contexts
      const browserLang =
        typeof navigator !== 'undefined' && navigator.language ? navigator.language.substring(0, 2) : 'en';
      const supportedLanguages = ['en', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'ru', 'zh'];
      return supportedLanguages.includes(browserLang) ? browserLang : 'en';
    } catch {
      return 'en';
    }
  };

  return {
    getCurrent: getCurrentLocale,
    LANGUAGES: {
      en: {},
      de: {},
      es: {},
      fr: {},
      it: {},
      pl: {},
      pt: {},
      ru: {},
      zh: {},
      [getCurrentLocale()]: {}, // Dynamic key for current locale
    } as Record<string, any>,
  };
};

/**
 * Simple truncate function to replace lodash dependency in sandboxed contexts.
 *
 * Context Isolation Security: External dependencies like lodash may not be
 * available in renderer/preload context, so we provide this safe implementation.
 *
 * @param {string} str - The string to truncate
 * @param {Object} options - Options object with length property
 * @returns {string} The truncated string with ellipsis if needed
 */
export const truncate = (str: string, options: {length: number}): string => {
  if (str.length <= options.length) {
    return str;
  }
  return `${str.slice(0, options.length - 3)}...`;
};

/**
 * Simplified AutomatedSingleSignOn implementation for sandboxed contexts.
 *
 * Context Isolation Security: The full SSO implementation has too many main process
 * dependencies to be safely imported in renderer/preload. This provides a minimal interface.
 */
export class SandboxAutomatedSingleSignOn {
  private readonly logger = createSandboxLogger('SandboxAutomatedSingleSignOn');

  start(code: string): void {
    // Simplified SSO handling - just log for now since full implementation has too many dependencies
    this.logger.info('SSO login requested with code:', `${code.substring(0, 10)}...`);
    // In a real implementation, this would handle the SSO flow through IPC to main process
  }
}

// This export statement is required to make this file a TypeScript module
// and prevent global scope pollution. Without it, all declarations would
// be in the global scope, which can cause naming conflicts.
export type ModuleMarker = never;

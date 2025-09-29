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
import type {Data as OpenGraphResult} from 'open-graph';

import type {Availability} from '@wireapp/protocol-messaging';

// Context Isolation Security: Constants and utilities must be defined inline
// because sandboxed preload scripts cannot import from relative paths due to
// limited CommonJS module resolution in Electron's sandbox environment.
// These are kept in sync with ../shared/contextIsolationConstants.ts
// Context Isolation Security: WebApp events constants
// These cannot be imported from @wireapp/webapp-events due to context isolation restrictions.
const WebAppEvents = {
  CALL: {
    STATE: {
      TOGGLE: 'wire.webapp.call.state.toggle',
    },
  },
  CONVERSATION: {
    JOIN: 'wire.webapp.conversation.join',
  },
  LIFECYCLE: {
    ASK_TO_CLEAR_DATA: 'wire.webapp.lifecycle.ask_to_clear_data',
    CHANGE_ENVIRONMENT: 'wire.webapp.lifecycle.change_environment',
    LOADED: 'wire.webapp.lifecycle.loaded',
    RESTART: 'wire.webapp.lifecycle.restart',
    SIGN_OUT: 'wire.webapp.lifecycle.sign_out',
    SIGNED_OUT: 'wire.webapp.lifecycle.signed_out',
    SSO_WINDOW_CLOSE: 'wire.webapp.lifecycle.sso_window_close',
    SSO_WINDOW_CLOSED: 'wire.webapp.lifecycle.sso_window_closed',
    SSO_WINDOW_FOCUS: 'wire.webapp.lifecycle.sso_window_focus',
    UNREAD_COUNT: 'wire.webapp.lifecycle.unread_count',
    UPDATE: 'wire.webapp.lifecycle.update',
  },
  NOTIFICATION: {
    CLICK: 'wire.webapp.notification.click',
  },
  PREFERENCES: {
    MANAGE_ACCOUNT: 'wire.webapp.preferences.manage_account',
  },
  PROPERTIES: {
    UPDATE: {
      INTERFACE: {
        USE_DARK_MODE: 'wire.webapp.properties.update.interface.use_dark_mode',
        THEME: 'wire.webapp.properties.update.interface.theme',
      },
    },
    UPDATED: 'wire.webapp.properties.updated',
  },
  SHORTCUT: {
    ADD_PEOPLE: 'wire.webapp.shortcut.add_people',
    ARCHIVE: 'wire.webapp.shortcut.archive',
    DELETE: 'wire.webapp.shortcut.delete',
    NEXT: 'wire.webapp.shortcut.next',
    PEOPLE: 'wire.webapp.shortcut.people',
    PING: 'wire.webapp.shortcut.ping',
    PREV: 'wire.webapp.shortcut.prev',
    SEARCH: 'wire.webapp.shortcut.search',
    SILENCE: 'wire.webapp.shortcut.silence',
    START: 'wire.webapp.shortcut.start',
  },
  TEAM: {
    DOWNLOAD_PATH_UPDATE: 'wire.webapp.team.download_path_update',
    INFO: 'wire.webapp.team.info',
  },
} as const;

/**
 * Event type constants for IPC communication
 *
 * IMPORTANT: This is a necessary duplication of ../shared/contextIsolationConstants.ts
 * due to Electron sandbox limitations. Keep in sync with the shared file.
 */
const EVENT_TYPE = {
  ACCOUNT: {
    UPDATE_INFO: 'EVENT_TYPE.ACCOUNT.UPDATE_INFO',
  },
  ACTION: {
    CHANGE_DOWNLOAD_LOCATION: 'EVENT_TYPE.ACTION.CHANGE_DOWNLOAD_LOCATION',
    DECRYPT: 'EVENT_TYPE.ACTION.DECRYPT',
    ENCRYPT: 'EVENT_TYPE.ACTION.ENCRYPT',
    GET_DESKTOP_SOURCES: 'EVENT_TYPE.ACTION.GET_DESKTOP_SOURCES',
    GET_OG_DATA: 'EVENT_TYPE.ACTION.GET_OG_DATA',
    JOIN_CONVERSATION: 'EVENT_TYPE.ACTION.JOIN_CONVERSATION',
    NOTIFICATION_CLICK: 'EVENT_TYPE.ACTION.NOTIFICATION_CLICK',
    SIGN_OUT: 'EVENT_TYPE.ACTION.SIGN_OUT',
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
    SHOULD_USE_DARK_COLORS: 'EVENT_TYPE.UI.SHOULD_USE_DARK_COLORS',
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
    UPDATE_AVAILABLE: 'EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE',
  },
} as const;

/**
 * Safe logger for sandboxed preload context
 *
 * IMPORTANT: This is a necessary duplication of ../shared/contextIsolationConstants.ts
 * due to Electron sandbox limitations. Keep in sync with the shared file.
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
 * Environment utilities for sandboxed context
 *
 * Context Isolation Security: Safe environment detection that works in
 * sandboxed contexts without accessing main process modules.
 */
const EnvironmentUtil = {
  platform: {
    IS_MAC_OS:
      typeof process !== 'undefined'
        ? process.platform === 'darwin'
        : typeof navigator !== 'undefined'
        ? navigator.platform.includes('Mac')
        : false,
  },
  app: {
    // Context Isolation Security: Version is hardcoded to avoid importing config module
    // This should match the version in wire.json
    DESKTOP_VERSION: '3.40.0',
  },
};

interface TeamAccountInfo {
  accentID: number;
  availability?: Availability.Type;
  darkMode: boolean;
  name: string;
  picture?: string;
  teamID?: string;
  teamRole: string;
  userID: string;
}

type Theme = 'dark' | 'default';

/**
 * Logger for preload webview script
 *
 * Context Isolation Security: Uses shared sandbox logger instead of main process getLogger
 * which cannot be imported in preload scripts due to context isolation.
 */
const logger = createSandboxLogger('preload-webview');

function subscribeToThemeChange(): void {
  async function initialThemeCheck() {
    const useDarkMode = await ipcRenderer.invoke(EVENT_TYPE.UI.SHOULD_USE_DARK_COLORS);
    logger.info(`Switching initial dark mode ${useDarkMode ? 'on' : 'off'} ...`);
    window.amplify.publish(WebAppEvents.PROPERTIES.UPDATE.INTERFACE.USE_DARK_MODE, useDarkMode);
    window.amplify.unsubscribe(WebAppEvents.LIFECYCLE.LOADED, initialThemeCheck);
  }

  function handleSystemThemeChange() {
    ipcRenderer.on(EVENT_TYPE.UI.SYSTEM_THEME_CHANGED, async () => {
      const useDarkMode = await ipcRenderer.invoke(EVENT_TYPE.UI.SHOULD_USE_DARK_COLORS);
      logger.info(`System theme changed, switching dark mode ${useDarkMode ? 'on' : 'off'} ...`);
      window.amplify.publish(WebAppEvents.PROPERTIES.UPDATE.INTERFACE.USE_DARK_MODE, useDarkMode);
    });
  }

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.LOADED, () => {
    ipcRenderer.send(EVENT_TYPE.WEBAPP.APP_LOADED);
    initialThemeCheck();
  });

  handleSystemThemeChange();
}

webFrame.setZoomFactor(1.0);
webFrame.setVisualZoomLevelLimits(1, 1);

const subscribeToWebappEvents = (): void => {
  window.amplify.subscribe(WebAppEvents.LIFECYCLE.RESTART, () => {
    logger.info(`Received amplify event "${WebAppEvents.LIFECYCLE.RESTART}", forwarding event ...`);
    ipcRenderer.send(EVENT_TYPE.WRAPPER.RELAUNCH);
  });

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.LOADED, () => {
    logger.info(`Received amplify event "${WebAppEvents.LIFECYCLE.LOADED}", forwarding event ...`);
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGNED_IN);
  });

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.SIGN_OUT, () => {
    logger.info(`Received amplify event "${WebAppEvents.LIFECYCLE.SIGN_OUT}", forwarding event ...`);
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGN_OUT);
  });

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.SIGNED_OUT, (clearData: boolean) => {
    logger.info(
      `Received amplify event "${WebAppEvents.LIFECYCLE.SIGNED_OUT}", (clearData: "${clearData}") forwarding event ...`,
    );
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGNED_OUT, clearData);
  });

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSE, () => {
    logger.info(`Received amplify event "${WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSE}" event`);
    ipcRenderer.send(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSE);
  });

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.SSO_WINDOW_FOCUS, () => {
    logger.info(`Received amplify event "${WebAppEvents.LIFECYCLE.SSO_WINDOW_FOCUS}" event`);
    ipcRenderer.send(WebAppEvents.LIFECYCLE.SSO_WINDOW_FOCUS);
  });

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.UNREAD_COUNT, (count: string) => {
    logger.info(
      `Received amplify event "${WebAppEvents.LIFECYCLE.UNREAD_COUNT}" (count: "${count}"), forwarding event ...`,
    );
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.UNREAD_COUNT, count);
  });

  window.amplify.subscribe(WebAppEvents.NOTIFICATION.CLICK, () => {
    logger.info(`Received amplify event "${WebAppEvents.NOTIFICATION.CLICK}", forwarding event ...`);
    ipcRenderer.send(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
    ipcRenderer.sendToHost(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
  });

  window.amplify.subscribe(WebAppEvents.TEAM.INFO, (info: TeamAccountInfo) => {
    const debugInfo = {
      ...info,
      picture: typeof info.picture === 'string' ? `${info.picture.substring(0, 100)}...` : '',
    };
    logger.info(
      `Received amplify event "${WebAppEvents.TEAM.INFO}":`,
      `"${JSON.stringify(debugInfo)}", forwarding event ...`,
    );
    ipcRenderer.sendToHost(EVENT_TYPE.ACCOUNT.UPDATE_INFO, info);
  });

  window.amplify.subscribe(WebAppEvents.TEAM.DOWNLOAD_PATH_UPDATE, (downloadPath?: string) => {
    logger.info(`Received amplify event ${WebAppEvents.TEAM.DOWNLOAD_PATH_UPDATE}:`, `"${downloadPath}",`);
    logger.info('forwarding last event ...');
    ipcRenderer.send(EVENT_TYPE.ACTION.CHANGE_DOWNLOAD_LOCATION, downloadPath);
  });

  window.addEventListener(WebAppEvents.LIFECYCLE.CHANGE_ENVIRONMENT, event => {
    const data = (event as CustomEvent).detail;
    if (data) {
      ipcRenderer.sendToHost(EVENT_TYPE.WRAPPER.NAVIGATE_WEBVIEW, data.url);
    }
  });

  window.amplify.subscribe(WebAppEvents.PROPERTIES.UPDATE.INTERFACE.THEME, (theme: Theme) => {
    ipcRenderer.sendToHost(EVENT_TYPE.UI.THEME_UPDATE, theme);
  });

  window.amplify.subscribe(WebAppEvents.PROPERTIES.UPDATED, (properties: {settings: {interface: {theme: Theme}}}) => {
    ipcRenderer.sendToHost(EVENT_TYPE.UI.THEME_UPDATE, properties.settings.interface.theme);
  });
};

const subscribeToMainProcessEvents = (): void => {
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.ADD_PEOPLE, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.ADD_PEOPLE}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.ADD_PEOPLE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.ARCHIVE, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.ARCHIVE}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.ARCHIVE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.CALL, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.CALL}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.CALL.STATE.TOGGLE, false);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.DELETE, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.DELETE}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.DELETE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW_NEXT, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.SHOW_NEXT}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.NEXT);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.PEOPLE, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.PEOPLE}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.PEOPLE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.PING, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.PING}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.PING);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW_PREVIOUS, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.SHOW_PREVIOUS}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.PREV);
  });
  ipcRenderer.on(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, (_event, hash: string) => {
    logger.info(
      `Received event "${EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH}" (hash: "${hash}"), forwarding to amplify ...`,
    );
    window.location.hash = hash;
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.TOGGLE_MUTE, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.TOGGLE_MUTE}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.SILENCE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.START, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.START}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.START);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SEARCH, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.SEARCH}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.SHORTCUT.SEARCH);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.VIDEO_CALL, () => {
    logger.info(`Received event "${EVENT_TYPE.CONVERSATION.VIDEO_CALL}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.CALL.STATE.TOGGLE, true);
  });
  ipcRenderer.on(EVENT_TYPE.PREFERENCES.SHOW, () => {
    logger.info(`Received event "${EVENT_TYPE.PREFERENCES.SHOW}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.PREFERENCES.MANAGE_ACCOUNT);
  });
  ipcRenderer.on(EVENT_TYPE.ACTION.SIGN_OUT, () => {
    logger.info(`Received event "${EVENT_TYPE.ACTION.SIGN_OUT}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.LIFECYCLE.ASK_TO_CLEAR_DATA);
  });
  ipcRenderer.on(EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE, () => {
    logger.info(`Received event "${EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.LIFECYCLE.UPDATE, window.z.lifecycle.UPDATE_SOURCE.DESKTOP);
  });
  ipcRenderer.on(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSED, () => {
    logger.info(`Received event "${WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSED}", forwarding to window ...`);
    window.amplify.publish(WebAppEvents.LIFECYCLE.SSO_WINDOW_CLOSED);
  });
  ipcRenderer.on(
    EVENT_TYPE.ACTION.JOIN_CONVERSATION,
    (_event, {code, key, domain}: {code: string; key: string; domain?: string}) => {
      logger.info(`Received event "${EVENT_TYPE.ACTION.JOIN_CONVERSATION}", forwarding to host ...`);
      ipcRenderer.sendToHost(EVENT_TYPE.ACTION.JOIN_CONVERSATION, {code, key, domain});
    },
  );
  ipcRenderer.on(
    WebAppEvents.CONVERSATION.JOIN,
    (_event, {code, key, domain}: {code: string; key: string; domain: string}) => {
      logger.info(`Received event "${WebAppEvents.CONVERSATION.JOIN}", forwarding to window ...`);
      window.dispatchEvent(new CustomEvent(WebAppEvents.CONVERSATION.JOIN, {detail: {code, key, domain}}));
    },
  );
};

function getOpenGraphDataViaChannel(url: string): Promise<OpenGraphResult> {
  return ipcRenderer.invoke(EVENT_TYPE.ACTION.GET_OG_DATA, url);
}

function reportWebappVersion(): void {
  ipcRenderer.send(EVENT_TYPE.UI.WEBAPP_VERSION, window.z.util.Environment.version(false));
}
function reportWebappAVSVersion(): void {
  const avsVersion = window.z.util.Environment.avsVersion?.();
  if (avsVersion) {
    ipcRenderer.send(EVENT_TYPE.UI.WEBAPP_AVS_VERSION, avsVersion);
  }
}

// https://github.com/electron/electron/issues/2984
const _clearImmediate = clearImmediate;
const _setImmediate = setImmediate;

contextBridge.exposeInMainWorld('wireWebview', {
  clearImmediate: _clearImmediate,
  setImmediate: _setImmediate,

  desktopCapturer: {
    getDesktopSources: (opts: any) => ipcRenderer.invoke(EVENT_TYPE.ACTION.GET_DESKTOP_SOURCES, opts),
  },

  systemCrypto: {
    decrypt: async (encrypted: Uint8Array): Promise<string> => {
      return ipcRenderer.invoke(EVENT_TYPE.ACTION.DECRYPT, encrypted);
    },
    encrypt: (value: string): Promise<Uint8Array> => {
      return ipcRenderer.invoke(EVENT_TYPE.ACTION.ENCRYPT, value);
    },
    version: 1,
  },

  environment: EnvironmentUtil,
  desktopAppConfig: {version: EnvironmentUtil.app.DESKTOP_VERSION, supportsCallingPopoutWindow: true},
  openGraphAsync: getOpenGraphDataViaChannel,

  contextMenu: {
    copyText: (text: string) => ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.COPY_TEXT, text),
    copyImage: (imageUrl: string) => ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.COPY_IMAGE, imageUrl),
    saveImage: (imageUrl: string, timestamp?: string) =>
      ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.SAVE_IMAGE, imageUrl, timestamp),
    replaceMisspelling: (suggestion: string) =>
      ipcRenderer.invoke(EVENT_TYPE.CONTEXT_MENU.REPLACE_MISSPELLING, suggestion),
  },
});

const registerEvents = (): Promise<void> => {
  return new Promise(resolve => {
    const HALF_SECOND_IN_MILLIS = 500;
    const intervalId = setInterval(() => {
      logger.info('Attempting to register event handlers...');
      if (window.amplify && window.wire && window.z?.event) {
        clearInterval(intervalId);
        return resolve();
      }
    }, HALF_SECOND_IN_MILLIS);
  });
};

window.addEventListener('DOMContentLoaded', async () => {
  await registerEvents();
  logger.info('Registering event handlers');
  subscribeToMainProcessEvents();
  subscribeToThemeChange();
  subscribeToWebappEvents();
  reportWebappVersion();
  reportWebappAVSVersion();
  // include context menu
  await import('./menu/preload-context');
});

// overwrite window.close() to prevent webapp from closing itself
// see SQSERVICES-1882 and SQSERVICES-1919
window.close = () => {};

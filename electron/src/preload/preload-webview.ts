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
import type {Data as OpenGraphResult} from 'open-graph';

import * as path from 'path';

import type {Availability} from '@wireapp/protocol-messaging';
import {WebAppEvents} from '@wireapp/webapp-events';

import {EVENT_TYPE} from '../lib/eventType';
import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';

const remote = require('@electron/remote');

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

const logger = getLogger(path.basename(__filename));

function subscribeToThemeChange(): void {
  function updateWebAppTheme(): void {
    if (WebAppEvents.PROPERTIES.UPDATE.INTERFACE) {
      const useDarkMode = remote.nativeTheme.shouldUseDarkColors;
      logger.info(`Switching dark mode ${useDarkMode ? 'on' : 'off'} ...`);
      window.amplify.publish(WebAppEvents.PROPERTIES.UPDATE.INTERFACE.USE_DARK_MODE, useDarkMode);
    }
  }

  function initialThemeCheck() {
    const useDarkMode = remote.nativeTheme.shouldUseDarkColors;
    logger.info(`Switching initial dark mode ${useDarkMode ? 'on' : 'off'} ...`);
    window.amplify.publish(WebAppEvents.PROPERTIES.UPDATE.INTERFACE.USE_DARK_MODE, useDarkMode);
    window.amplify.unsubscribe(WebAppEvents.LIFECYCLE.LOADED, initialThemeCheck);
  }

  window.amplify.subscribe(WebAppEvents.LIFECYCLE.LOADED, () => {
    ipcRenderer.send(EVENT_TYPE.WEBAPP.APP_LOADED);
    initialThemeCheck();
  });
  remote.nativeTheme.on('updated', () => updateWebAppTheme());
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

process.once('loaded', () => {
  global.clearImmediate = _clearImmediate;
  /**
   * @todo: This can be improved by polyfilling getDisplayMedia function
   * Example: https://github.com/electron/electron/issues/16513#issuecomment-602070250
   */
  global.desktopCapturer = {
    getDesktopSources: opts => ipcRenderer.invoke(EVENT_TYPE.ACTION.GET_DESKTOP_SOURCES, opts),
  };
  global.systemCrypto = {
    decrypt: async (encrypted: Uint8Array): Promise<string> => {
      return ipcRenderer.invoke(EVENT_TYPE.ACTION.DECRYPT, encrypted);
    },
    encrypt: (value: string): Promise<Uint8Array> => {
      return ipcRenderer.invoke(EVENT_TYPE.ACTION.ENCRYPT, value);
    },
    version: 1,
  };
  global.environment = EnvironmentUtil;
  global.desktopAppConfig = {version: EnvironmentUtil.app.DESKTOP_VERSION, supportsCallingPopoutWindow: true};
  global.openGraphAsync = getOpenGraphDataViaChannel;
  global.setImmediate = _setImmediate;
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

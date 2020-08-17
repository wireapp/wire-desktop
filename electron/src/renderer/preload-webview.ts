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

import {desktopCapturer, ipcRenderer, remote, webFrame} from 'electron';
import * as path from 'path';
import {WebAppEvents} from '@wireapp/webapp-events';
import {Availability} from '@wireapp/protocol-messaging';

import {EVENT_TYPE} from '../lib/eventType';
import {getOpenGraphDataAsync} from '../lib/openGraph';
import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';

interface TeamAccountInfo {
  accentID: number;
  availability?: Availability.Type;
  name: string;
  picture?: string;
  teamID?: string;
  teamRole: string;
  userID: string;
}

const systemPreferences = remote.systemPreferences;

const logger = getLogger(path.basename(__filename));

// Note: Until appearance-changed event is available in a future
// version of Electron use `AppleInterfaceThemeChangedNotification` event
function subscribeToThemeChange(): void {
  if (EnvironmentUtil.platform.IS_MAC_OS && WebAppEvents.PROPERTIES.UPDATE.INTERFACE) {
    systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
      logger.info('Received macOS notification "AppleInterfaceThemeChangedNotification", forwarding to amplify ...');
      window.amplify.publish(WebAppEvents.PROPERTIES.UPDATE.INTERFACE.USE_DARK_MODE, systemPreferences.isDarkMode());
    });
  }
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

  window.addEventListener(WebAppEvents.LIFECYCLE.CHANGE_ENVIRONMENT, event => {
    const data = (event as CustomEvent).detail;
    if (data) {
      ipcRenderer.sendToHost(EVENT_TYPE.WRAPPER.NAVIGATE_WEBVIEW, data.url);
    }
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
  ipcRenderer.on(EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE, () => {
    logger.info(`Received event "${EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE}", forwarding to amplify ...`);
    window.amplify.publish(WebAppEvents.LIFECYCLE.UPDATE, window.z.lifecycle.UPDATE_SOURCE.DESKTOP);
  });
};

const reportWebappVersion = () =>
  ipcRenderer.send(EVENT_TYPE.UI.WEBAPP_VERSION, window.z.util.Environment.version(false));

// https://github.com/electron/electron/issues/2984
const _clearImmediate = clearImmediate;
const _setImmediate = setImmediate;

process.once('loaded', () => {
  global.clearImmediate = _clearImmediate;
  global.environment = EnvironmentUtil;
  global.desktopCapturer = desktopCapturer;
  global.openGraphAsync = getOpenGraphDataAsync;
  global.setImmediate = _setImmediate;
});

const registerEvents = (callback: () => void): void => {
  const HALF_SECOND_IN_MILLIS = 500;

  const intervalId = setInterval(() => {
    logger.info('Attempting to register event handlers...');
    if (window.amplify && window.wire && window.z?.event) {
      clearInterval(intervalId);
      return callback();
    }
  }, HALF_SECOND_IN_MILLIS);
};

window.addEventListener('DOMContentLoaded', () => {
  registerEvents(() => {
    logger.info('Registering event handlers');
    subscribeToMainProcessEvents();
    subscribeToThemeChange();
    subscribeToWebappEvents();
    reportWebappVersion();
  });
  // include context menu
  import('./menu/context').catch(logger.error);
});

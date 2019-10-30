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

import {IpcMessageEvent, desktopCapturer, ipcRenderer, remote, webFrame} from 'electron';
import * as path from 'path';

import {EVENT_TYPE} from '../lib/eventType';
import {getOpenGraphDataAsync} from '../lib/openGraph';
import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';

const logger = getLogger(path.basename(__filename));

interface TeamAccountInfo {
  accentID: string;
  name: string;
  picture: string;
  teamID?: string;
  teamRole: string;
  userID: string;
}

const systemPreferences = remote.systemPreferences;

// Note: Until appearance-changed event is available in a future
// version of Electron use `AppleInterfaceThemeChangedNotification` event
function subscribeToThemeChange(): void {
  if (EnvironmentUtil.platform.IS_MAC_OS && window.z.event.WebApp.PROPERTIES.UPDATE.INTERFACE) {
    systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () =>
      window.amplify.publish(
        window.z.event.WebApp.PROPERTIES.UPDATE.INTERFACE.USE_DARK_MODE,
        systemPreferences.isDarkMode(),
      ),
    );
  }
}

webFrame.setZoomFactor(1.0);
webFrame.setVisualZoomLevelLimits(1, 1);

const subscribeToWebappEvents = () => {
  window.amplify.subscribe(window.z.event.WebApp.LIFECYCLE.RESTART, () => {
    ipcRenderer.send(EVENT_TYPE.WRAPPER.RELAUNCH);
  });

  window.amplify.subscribe(window.z.event.WebApp.LIFECYCLE.LOADED, () => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGNED_IN);
  });

  window.amplify.subscribe(window.z.event.WebApp.LIFECYCLE.SIGN_OUT, () => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGN_OUT);
  });

  window.amplify.subscribe(window.z.event.WebApp.LIFECYCLE.SIGNED_OUT, (clearData: boolean) => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGNED_OUT, clearData);
  });

  window.amplify.subscribe(window.z.event.WebApp.LIFECYCLE.UNREAD_COUNT, (count: string) => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.UNREAD_COUNT, count);
  });

  window.amplify.subscribe(window.z.event.WebApp.NOTIFICATION.CLICK, () => {
    ipcRenderer.send(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
    ipcRenderer.sendToHost(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
  });

  window.amplify.subscribe(window.z.event.WebApp.TEAM.INFO, (info: TeamAccountInfo) => {
    ipcRenderer.sendToHost(EVENT_TYPE.ACCOUNT.UPDATE_INFO, info);
  });
};

const subscribeToMainProcessEvents = () => {
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.ADD_PEOPLE, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.ADD_PEOPLE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.ARCHIVE, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.ARCHIVE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.CALL, () => {
    window.amplify.publish(window.z.event.WebApp.CALL.STATE.TOGGLE, false);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.DELETE, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.DELETE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW_NEXT, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.NEXT);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.PEOPLE, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.PEOPLE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.PING, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.PING);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW_PREVIOUS, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.PREV);
  });
  ipcRenderer.on(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, (event: IpcMessageEvent, hash: string) => {
    window.location.hash = hash;
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.TOGGLE_MUTE, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.SILENCE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.START, () => {
    window.amplify.publish(window.z.event.WebApp.SHORTCUT.START);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.VIDEO_CALL, () => {
    window.amplify.publish(window.z.event.WebApp.CALL.STATE.TOGGLE, true);
  });
  ipcRenderer.on(EVENT_TYPE.PREFERENCES.SHOW, () => {
    window.amplify.publish(window.z.event.WebApp.PREFERENCES.MANAGE_ACCOUNT);
  });
  ipcRenderer.on(EVENT_TYPE.ACTION.SIGN_OUT, () => {
    window.amplify.publish(window.z.event.WebApp.LIFECYCLE.ASK_TO_CLEAR_DATA);
  });
  ipcRenderer.on(EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE, () => {
    window.amplify.publish(window.z.event.WebApp.LIFECYCLE.UPDATE, window.z.lifecycle.UPDATE_SOURCE.DESKTOP);
  });
};

const exposeAddressBook = () => {
  const getAddressBook = () => {
    return undefined;
  };

  if (EnvironmentUtil.platform.IS_MAC_OS) {
    Object.defineProperty(window, 'wAddressBook', {get: getAddressBook});
  }
};

const reportWebappVersion = () =>
  ipcRenderer.send(EVENT_TYPE.UI.WEBAPP_VERSION, window.z.util.Environment.version(false));

const checkAvailability = (callback: () => void) => {
  const HALF_SECOND = 500;

  const intervalId = setInterval(() => {
    if (window.wire) {
      clearInterval(intervalId);
      return callback();
    }

    if (navigator.onLine) {
      // Loading webapp failed
      clearInterval(intervalId);
      location.reload();
    }
  }, HALF_SECOND);
};

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

// Expose SSO capability to webapp before anything is rendered
Object.defineProperty(window, 'wSSOCapable', {
  configurable: false,
  enumerable: false,
  value: true,
  writable: false,
});

window.addEventListener('DOMContentLoaded', () => {
  checkAvailability(() => {
    exposeAddressBook();
    subscribeToMainProcessEvents();
    subscribeToThemeChange();
    subscribeToWebappEvents();
    reportWebappVersion();
    import('./menu/context').catch(error => logger.error(error));
  });
});

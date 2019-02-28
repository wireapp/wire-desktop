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

const config = require('../../dist/js/config');
const environment = require('../../dist/js/environment');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const {getLogger} = require('../../dist/js/getLogger');
const {EVENT_TYPE} = require('../../dist/lib/eventType');

const {desktopCapturer, ipcRenderer, remote, webFrame} = require('electron');
const {app, systemPreferences} = remote;

const logger = getLogger('webview-preload');

// Note: Until appearance-changed event is available in a future
// version of Electron... use AppleInterfaceThemeChangedNotification event
function subscribeToThemeChange() {
  if (environment.platform.IS_MAC_OS && z.event.WebApp.PROPERTIES.UPDATE.INTERFACE) {
    systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () =>
      amplify.publish(z.event.WebApp.PROPERTIES.UPDATE.INTERFACE.USE_DARK_MODE, systemPreferences.isDarkMode())
    );
  }
}

webFrame.setZoomFactor(1.0);
webFrame.setVisualZoomLevelLimits(1, 1);
webFrame.registerURLSchemeAsBypassingCSP('file');

const subscribeToWebappEvents = () => {
  amplify.subscribe(z.event.WebApp.LIFECYCLE.RESTART, () => {
    ipcRenderer.send(EVENT_TYPE.WRAPPER.RELAUNCH);
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.LOADED, () => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGNED_IN);
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.SIGN_OUT, () => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGN_OUT);
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.SIGNED_OUT, clearData => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGNED_OUT, clearData);
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.UNREAD_COUNT, count => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.UNREAD_COUNT, count);
  });

  amplify.subscribe(z.event.WebApp.NOTIFICATION.CLICK, () => {
    ipcRenderer.send(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
    ipcRenderer.sendToHost(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
  });

  amplify.subscribe(z.event.WebApp.TEAM.INFO, info => {
    ipcRenderer.sendToHost(EVENT_TYPE.ACCOUNT.UPDATE_INFO, info);
  });
};

const subscribeToMainProcessEvents = () => {
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.ADD_PEOPLE, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.ADD_PEOPLE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.ARCHIVE, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.ARCHIVE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.CALL, () => {
    amplify.publish(z.event.WebApp.CALL.STATE.TOGGLE, false);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.DELETE, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.DELETE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW_NEXT, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.NEXT);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.PEOPLE, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.PEOPLE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.PING, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.PING);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW_PREVIOUS, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.PREV);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW, conversationId => {
    amplify.publish(z.event.WebApp.CONVERSATION.SHOW, conversationId);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.TOGGLE_MUTE, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.SILENCE);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.START, () => {
    amplify.publish(z.event.WebApp.SHORTCUT.START);
  });
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.VIDEO_CALL, () => {
    amplify.publish(z.event.WebApp.CALL.STATE.TOGGLE, true);
  });
  ipcRenderer.on(EVENT_TYPE.PREFERENCES.SHOW, () => {
    amplify.publish(z.event.WebApp.PREFERENCES.MANAGE_ACCOUNT);
  });
  ipcRenderer.on(EVENT_TYPE.ACTION.SIGN_OUT, () => {
    amplify.publish(z.event.WebApp.LIFECYCLE.ASK_TO_CLEAR_DATA);
  });
  ipcRenderer.on(EVENT_TYPE.WRAPPER.UPDATE_AVAILABLE, () => {
    amplify.publish(z.event.WebApp.LIFECYCLE.UPDATE, z.lifecycle.UPDATE_SOURCE.DESKTOP);
  });
};

const exposeAddressBook = () => {
  let cachedAddressBook;

  const getAddressBook = () => {
    if (!cachedAddressBook) {
      try {
        cachedAddressBook = require('node-addressbook');
      } catch (error) {
        logger.info('Failed loading "node-addressbook".', error);
      }
    }
    return cachedAddressBook;
  };

  if (environment.platform.IS_MAC_OS) {
    Object.defineProperty(window, 'wAddressBook', {get: getAddressBook});
  }
};

const enableFileLogging = () => {
  const currentLocation = new URL(window.location.href);
  const id = currentLocation.searchParams.get('id');

  if (id) {
    const logFilePath = path.join(app.getPath('userData'), 'logs', id, config.LOG_FILE_NAME);
    fs.createFileSync(logFilePath);

    const webViewLogger = new winston.Logger();
    webViewLogger.add(winston.transports.File, {
      filename: logFilePath,
      handleExceptions: true,
    });

    webViewLogger.info(config.NAME, 'Version', config.VERSION);

    // webapp uses global winston reference to define log level
    global.winston = webViewLogger;
  }
};

const reportWebappVersion = () => ipcRenderer.send(EVENT_TYPE.UI.WEBAPP_VERSION, z.util.Environment.version(false));

const checkAvailability = callback => {
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
  }, 500);
};

// https://github.com/electron/electron/issues/2984
const _clearImmediate = clearImmediate;
const _setImmediate = setImmediate;
process.once('loaded', () => {
  const {getOpenGraphData} = require('../../dist/lib/openGraph');

  global.clearImmediate = _clearImmediate;
  global.desktopCapturer = desktopCapturer;
  global.environment = environment;
  global.openGraph = getOpenGraphData;
  global.setImmediate = _setImmediate;

  enableFileLogging();
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
    // include context menu
    require('../../dist/renderer/menu/context');
  });
});

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

const config = require('../../js/config');
const environment = require('../../js/environment');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');

const { desktopCapturer, ipcRenderer, remote, webFrame } = require('electron');
const { app } = remote;

webFrame.registerURLSchemeAsPrivileged('zeta', {secure: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, bypassCSP: false});
console.log('Registered protocol');

webFrame.setZoomLevelLimits(1, 1);
webFrame.registerURLSchemeAsBypassingCSP('file');

const subscribeToWebappEvents = () => {
  amplify.subscribe(z.event.WebApp.LIFECYCLE.RESTART, update_source => {
    if (update_source === z.lifecycle.UPDATE_SOURCE.DESKTOP) {
      ipcRenderer.send('wrapper-update');
    } else {
      ipcRenderer.send('wrapper-relaunch');
    }
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.LOADED, () => {
    ipcRenderer.sendToHost('lifecycle-signed-in');
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.SIGN_OUT, () => {
    ipcRenderer.sendToHost('lifecycle-signed-out');
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.SIGNED_OUT, clearData => {
    if (clearData) {
      ipcRenderer.sendToHost('signed-out');
    }
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.UNREAD_COUNT, count => {
    ipcRenderer.sendToHost('lifecycle-unread-count', count);
  });

  amplify.subscribe(z.event.WebApp.NOTIFICATION.CLICK, () => {
    ipcRenderer.send('notification-click');
    ipcRenderer.sendToHost('notification-click');
  });

  amplify.subscribe(z.event.WebApp.TEAM.INFO, info => {
    ipcRenderer.sendToHost('team-info', info);
  });
};

const subscribeToMainProcessEvents = () => {
  ipcRenderer.on('conversation-add-people', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.ADD_PEOPLE)
  );
  ipcRenderer.on('conversation-archive', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.ARCHIVE)
  );
  ipcRenderer.on('conversation-call', () =>
    amplify.publish(z.event.WebApp.CALL.STATE.TOGGLE, false)
  );
  ipcRenderer.on('conversation-delete', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.DELETE)
  );
  ipcRenderer.on('conversation-next', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.NEXT)
  );
  ipcRenderer.on('conversation-people', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.PEOPLE)
  );
  ipcRenderer.on('conversation-ping', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.PING)
  );
  ipcRenderer.on('conversation-prev', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.PREV)
  );
  ipcRenderer.on('conversation-show', conversation_id =>
    amplify.publish(z.event.WebApp.CONVERSATION.SHOW, conversation_id)
  );
  ipcRenderer.on('conversation-silence', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.SILENCE)
  );
  ipcRenderer.on('conversation-start', () =>
    amplify.publish(z.event.WebApp.SHORTCUT.START)
  );
  ipcRenderer.on('conversation-video-call', () =>
    amplify.publish(z.event.WebApp.CALL.STATE.TOGGLE, true)
  );
  ipcRenderer.on('preferences-show', () =>
    amplify.publish(z.event.WebApp.PREFERENCES.MANAGE_ACCOUNT)
  );
  ipcRenderer.on('sign-out', () =>
    amplify.publish(z.event.WebApp.LIFECYCLE.ASK_TO_CLEAR_DATA)
  );
  ipcRenderer.on('wrapper-update-available', () =>
    amplify.publish(
      z.event.WebApp.LIFECYCLE.UPDATE,
      z.announce.UPDATE_SOURCE.DESKTOP
    )
  );
};

const exposeAddressbook = () => {
  let cachedAddressBook;

  const getAdressBook = () => {
    if (!cachedAddressBook) {
      try {
        cachedAddressBook = require('node-addressbook');
      } catch (error) {
        console.info('Failed loading "node-addressbook".', error);
      }
    }
    return cachedAddressBook;
  };

  if (environment.platform.IS_MAC_OS) {
    Object.defineProperty(window, 'wAddressBook', { get: getAdressBook });
  }
};

const replaceGoogleAuth = () => {
  if (window.wire.app === undefined) {
    return;
  }

  // hijack google authenticate method
  window.wire.app.service.connect_google._authenticate = () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('google-auth-request');
      ipcRenderer.once('google-auth-success', (event, token) => resolve(token));
      ipcRenderer.once('google-auth-error', reject);
    });
  };
};

const enableFileLogging = () => {
  const id = new URL(window.location).searchParams.get('id');

  if (id) {
    const logFilePath = path.join(
      app.getPath('userData'),
      'logs',
      id,
      config.LOG_FILE_NAME
    );
    fs.createFileSync(logFilePath);

    const logger = new winston.Logger();
    logger.add(winston.transports.File, {
      filename: logFilePath,
      handleExceptions: true,
    });

    logger.info(config.NAME, 'Version', config.VERSION);

    // webapp uses global winston reference to define log level
    global.winston = logger;
  }
};

const reportWebappVersion = () => {
  ipcRenderer.send('webapp-version', z.util.Environment.version(false));
};

const checkAvailability = callback => {
  const intervalId = setInterval(() => {
    if (window.wire) {
      clearInterval(intervalId);
      callback();
      return;
    }

    if (navigator.onLine) {
      // Loading webapp failed
      clearInterval(intervalId);
      location.reload();
    }
  }, 500);
};

const forceEmailLogin = () => {
  window.location.hash = '#login';
};

// https://github.com/electron/electron/issues/2984
const _setImmediate = setImmediate;
process.once('loaded', () => {
  global.setImmediate = _setImmediate;
  global.desktopCapturer = desktopCapturer;
  global.environment = environment;
  global.openGraph = require('../../js/lib/openGraph');
  global.notification_icon = path.join(
    app.getAppPath(),
    'img',
    'notification.png'
  );
  enableFileLogging();
  forceEmailLogin();
});

window.addEventListener('DOMContentLoaded', () => {
  checkAvailability(() => {
    exposeAddressbook();

    subscribeToMainProcessEvents();
    subscribeToWebappEvents();
    replaceGoogleAuth();
    reportWebappVersion();

    // include context menu
    require('../../js/menu/context');
  });
});

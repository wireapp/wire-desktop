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
import * as fs from 'fs-extra';
import * as path from 'path';
const winston = require('winston');

import * as config from '../../dist/js/config';
import * as environment from '../../dist/js/environment';
import {EVENT_TYPE} from '../../dist/js/lib/eventType';

import {AccountInfo} from '../interfaces';

const app = remote.app;

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

  amplify.subscribe(z.event.WebApp.LIFECYCLE.SIGNED_OUT, (clearData?: boolean) => {
    if (clearData) {
      ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.SIGNED_OUT);
    }
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.UNREAD_COUNT, (count: number) => {
    ipcRenderer.sendToHost(EVENT_TYPE.LIFECYCLE.UNREAD_COUNT, count);
  });

  amplify.subscribe(z.event.WebApp.NOTIFICATION.CLICK, () => {
    ipcRenderer.send(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
    ipcRenderer.sendToHost(EVENT_TYPE.ACTION.NOTIFICATION_CLICK);
  });

  amplify.subscribe(z.event.WebApp.TEAM.INFO, (info: AccountInfo) => {
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
  ipcRenderer.on(EVENT_TYPE.CONVERSATION.SHOW, (conversationId: string) => {
    amplify.publish(z.event.WebApp.CONVERSATION.SHOW, conversationId);
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
  const getAddressBook = () => {
    try {
      const cachedAddressBook = require('node-addressbook');
      return cachedAddressBook;
    } catch (error) {
      console.error('Failed loading "node-addressbook".', error);
    }
  };

  if (environment.platform.IS_MAC_OS) {
    Object.defineProperty(window, 'wAddressBook', {get: getAddressBook});
  }
};

const replaceGoogleAuth = () => {
  if (window.wire.app === undefined) {
    return;
  }

  // hijack google authenticate method
  const authenticateWithGoogle = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send(EVENT_TYPE.GOOGLE_OAUTH.REQUEST);
      ipcRenderer.once(EVENT_TYPE.GOOGLE_OAUTH.SUCCESS, (event: IpcMessageEvent, token: string) => resolve(token));
      ipcRenderer.once(EVENT_TYPE.GOOGLE_OAUTH.ERROR, reject);
    });
  };

  if (window.wire.app.service.connectGoogle) {
    window.wire.app.service.connectGoogle._authenticate = authenticateWithGoogle;
  } else if (window.wire.app.service.connect_google) {
    window.wire.app.service.connect_google._authenticate = authenticateWithGoogle;
  }
};

const enableFileLogging = () => {
  const id = new URL(window.location.href).searchParams.get('id');

  if (id) {
    const logFilePath = path.join(app.getPath('userData'), 'logs', id, config.LOG_FILE_NAME);
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

const reportWebappVersion = () => ipcRenderer.send(EVENT_TYPE.UI.WEBAPP_VERSION, z.util.Environment.version(false));

const checkAvailability = (callback: () => void) => {
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
  global.clearImmediate = _clearImmediate;
  global.setImmediate = _setImmediate;
  global.desktopCapturer = desktopCapturer;
  global.environment = environment;
  global.openGraph = require('../../dist/js/lib/openGraph');
  global.notification_icon = path.join(app.getAppPath(), 'img', 'notification.png');
  enableFileLogging();
});

window.addEventListener('DOMContentLoaded', () => {
  checkAvailability(() => {
    exposeAddressBook();

    subscribeToMainProcessEvents();
    subscribeToWebappEvents();
    replaceGoogleAuth();
    reportWebappVersion();

    // include context menu
    require('../../dist/js/menu/context');
  });
});

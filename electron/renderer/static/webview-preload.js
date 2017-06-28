/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

const {remote, ipcRenderer, webFrame, desktopCapturer} = require('electron');

webFrame.setZoomLevelLimits(1, 1);
webFrame.registerURLSchemeAsBypassingCSP('file');

function subscribeToWebappEvents() {
  amplify.subscribe(z.event.WebApp.SYSTEM_NOTIFICATION.CLICK, function() {
    ipcRenderer.send('notification-click');
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.LOADED, function() {
    ipcRenderer.send('loaded');
  });

  amplify.subscribe(z.event.WebApp.LIFECYCLE.RESTART, function(update_source) {
    if (update_source === z.announce.UPDATE_SOURCE.DESKTOP) {
      ipcRenderer.send('wrapper-restart');
    } else {
      ipcRenderer.send('wrapper-reload');
    }
  });
}

function subscribeToMainProcessEvent() {
  ipcRenderer.on('sign-out', () => {
    amplify.publish(z.event.WebApp.LIFECYCLE.ASK_TO_CLEAR_DATA);
  });

  ipcRenderer.on('preferences-show', () => {
    amplify.publish(z.event.WebApp.PREFERENCES.MANAGE_ACCOUNT);
  });

  ipcRenderer.on('conversation-start', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.START);
  });

  ipcRenderer.on('conversation-ping', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.PING);
  });

  ipcRenderer.on('conversation-call', () => {
    amplify.publish(z.event.WebApp.CALL.STATE.TOGGLE, false);
  });

  ipcRenderer.on('conversation-video-call', () => {
    amplify.publish(z.event.WebApp.CALL.STATE.TOGGLE, true);
  });

  ipcRenderer.on('conversation-people', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.PEOPLE);
  });

  ipcRenderer.on('conversation-add-people', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.ADD_PEOPLE);
  });

  ipcRenderer.on('conversation-archive', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.ARCHIVE);
  });

  ipcRenderer.on('conversation-silence', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.SILENCE);
  });

  ipcRenderer.on('conversation-delete', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.DELETE);
  });

  ipcRenderer.on('conversation-prev', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.PREV);
  });

  ipcRenderer.on('conversation-next', () => {
    amplify.publish(z.event.WebApp.SHORTCUT.NEXT);
  });

  ipcRenderer.on('conversation-show', (conversation_id) => {
    amplify.publish(z.event.WebApp.CONVERSATION.SHOW, conversation_id);
  });

  ipcRenderer.on('wrapper-update-available', () => {
    amplify.publish(z.event.WebApp.LIFECYCLE.UPDATE, z.announce.UPDATE_SOURCE.DESKTOP);
  });
}

function exposeLibsodiumNeon() {
  try {
    Object.assign(window.sodium, require('libsodium-neon'));
    console.info('Using libsodium-neon.');
  } catch (error) {
    console.info('Failed loading "libsodium-neon", falling back to "libsodium.js".', error);
  }
}

function exposeAddressbook() {
  let cachedAddressBook;

  function getAdressBook () {
    if (cachedAddressBook == undefined) {
      try {
        cachedAddressBook = require('node-addressbook');
      } catch (error) {
        console.info('Failed loading "node-addressbook".', error);
      }
    }
    return cachedAddressBook;
  }

  if (process.platform === 'darwin') {
    Object.defineProperty(window, 'wAddressBook', {get: getAdressBook});
  }
}

function exposeOpenGraph() {
  try {
    Object.assign(window.openGraph, require('../../js/lib/openGraph'));
  } catch (error) {
    console.info('Failed loading "openGraph".', error);
  }
}

function replaceGoogleAuth(namespace = {}) {
  if (namespace.app === undefined) {
    return;
  }

  // hijack google authenticate method
  namespace.app.service.connect_google._authenticate = function() {
    return new Promise(function(resolve, reject) {
      ipcRenderer.send('google-auth-request');
      ipcRenderer.once('google-auth-success', function(event, token) {
        resolve(token);
      });
      ipcRenderer.once('google-auth-error', function(error) {
        reject(error);
      });
    });
  };
}

// https://github.com/electron/electron/issues/2984
const _setImmediate = setImmediate;

function onLoad() {
  global.setImmediate = _setImmediate;
  global.desktopCapturer = desktopCapturer;

  subscribeToWebappEvents()
  subscribeToMainProcessEvent()
  
  exposeAddressbook()
  exposeLibsodiumNeon()
  exposeOpenGraph();
  replaceGoogleAuth(window.wire)

  // include context menu
  require('../../js/menu/context')

  window.removeEventListener('DOMContentLoaded', onLoad);
}

if (document.readyState === 'complete') {
  onLoad();
} else {
  window.addEventListener('DOMContentLoaded', onLoad);
}

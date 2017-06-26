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

'use strict';

const {remote, ipcRenderer, webFrame, desktopCapturer} = require('electron');
const {app, webContents} = remote;

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
  global.openGraph = require('../js/lib/openGraph');

  subscribeToWebappEvents()
  exposeAddressbook()
  exposeLibsodiumNeon()
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

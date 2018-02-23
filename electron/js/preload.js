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

const { ipcRenderer, webFrame } = require('electron');
const environment = require('./environment');
const locale = require('../locale/locale');

webFrame.setZoomLevelLimits(1, 1);

window.locStrings = locale[locale.getCurrent()];
window.locStringsDefault = locale['en'];

window.isMac = environment.platform.IS_MAC_OS;

const getSelectedWebview = () => document.querySelector('.Webview:not(.hide)');
const getWebviewById = id => document.querySelector(`.Webview[data-accountid="${id}"]`);

const subscribeToMainProcessEvents = () => {
  ipcRenderer.on('system-menu', (event, action) => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      selectedWebview.send(action);
    }
  });
};

const setupIpcInterface = () => {
  window.sendBadgeCount = count => {
    ipcRenderer.send('badge-count', count);
  };

  window.sendDeleteAccount = (accountID, sessionID) => {
    const accountWebview = getWebviewById(accountID);
    accountWebview.getWebContents().session.clearStorageData();
    ipcRenderer.send('delete-account-data', accountID, sessionID);
  };

  window.sendLogoutAccount = accountId => {
    const accountWebview = getWebviewById(accountId);
    if (accountWebview) {
      accountWebview.send('sign-out');
    }
  };
};

const addDragRegion = () => {
  if (environment.platform.IS_MAC_OS) {
    // add titlebar ghost to prevent interactions with the content while dragging
    const titleBar = document.createElement('div');
    titleBar.className = 'drag-region';
    document.body.appendChild(titleBar);
  }
};

setupIpcInterface();
subscribeToMainProcessEvents();

window.addEventListener('DOMContentLoaded', () => {
  addDragRegion();
});

window.addEventListener('focus', () => {
  const selectedWebview = getSelectedWebview();
  if (selectedWebview) {
    selectedWebview.focus();
  }
});

// Updater-related
ipcRenderer.on('update-available', (event, detail) =>
  window.dispatchEvent(new CustomEvent('update-available', {detail})),
);
window.addEventListener('update-available-ack', (event) => ipcRenderer.send('update-available-ack', event.detail));

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

const {ipcRenderer, webFrame} = require('electron');

webFrame.setZoomLevelLimits(1, 1);

function getSelectedWebview() {
  return document.querySelector('.Webview:not(.hide)');
}

function subscribeToMainProcessEvents() {
  ipcRenderer.on('system-menu', (event, action) => {
    const selectedWebview = getSelectedWebview();
    if (selectedWebview) {
      selectedWebview.send(action);
    }
  });
}

function addDragRegion() {
  if (process.platform === 'darwin') {
    // add titlebar ghost to prevent interactions with the content while dragging
    const titleBar = document.createElement('div');
    titleBar.className = 'drag-region';
    document.body.appendChild(titleBar);
  }
}

window.reportBadgeCount = (count) => {
  ipcRenderer.send('badge-count', count);
};

subscribeToMainProcessEvents();

window.addEventListener('DOMContentLoaded', () => {
  addDragRegion();
});

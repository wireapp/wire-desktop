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

const {remote, ipcRenderer, shell} = require('electron');

const config = require('./config');
const locale = require('./../locale/locale');

const labels = document.getElementsByClassName('text');
for (const label of labels) {
  label.innerHTML = locale.getText(label.dataset.string);
}

document.getElementById('name').innerHTML = config.NAME;
document.getElementById('version').innerHTML = config.VERSION;

window.addEventListener('keydown', event => {
  if (event.keyCode === 27) {
    remote.getCurrentWindow().close();
  }
});

const links = document.getElementsByTagName('a');
for (const link of links) {
  link.onclick = function() {
    shell.openExternal(link.href);
    return false;
  };
}

ipcRenderer.once('about-loaded', (sender, details) => {
  if (details.webappVersion) {
    document.getElementById('webappVersion').innerHTML = details.webappVersion;
  } else {
    document.getElementById('webappVersion').parentNode.remove();
  }
});

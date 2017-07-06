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

const pkg = require('./../package.json');
const locale = require('./../locale/locale');

let labels = document.getElementsByClassName('text');
for (let label of labels) {
  label.innerHTML = locale.getText(label.dataset.string);
}

document.getElementById('name').innerHTML = pkg.productName;
document.getElementById('version').innerHTML = pkg.version;

window.addEventListener('keydown', function(event) {
  if (event.keyCode === 27) {
    remote.getCurrentWindow().close();
  }
});

let links = document.getElementsByTagName('a');
for (let link of links) {
  link.onclick = function() {
    shell.openExternal(link.href);
    return false;
  };
}

ipcRenderer.once('about-loaded', function(sender, config) {
  if (config.webappVersion) {
    document.getElementById('webappVersion').innerHTML = config.webappVersion;
  } else {
    document.getElementById('webappVersion').parentNode.remove();
  }
});

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

const {remote, ipcRenderer} = require('electron');

ipcRenderer.once('locale-render-text', (sender, labels) => {
  for (const label in labels) {
    console.log('set ' + label);
    document.querySelector(`[data-string="${label}"]`).innerHTML = labels[label];
  }
});

ipcRenderer.once('about-loaded', (sender, details) => {
  document.getElementById('name').innerHTML = details.productName;

  if (details.electronVersion) {
    document.getElementById('version').innerHTML = details.electronVersion;
  } else {
    document.getElementById('version').innerHTML = 'Development';
  }

  if (details.webappVersion) {
    document.getElementById('webappVersion').innerHTML = details.webappVersion;
  } else {
    document.getElementById('webappVersion').parentNode.remove();
  }

  // Get locales
  const labels = [];
  for (const label of document.querySelectorAll('[data-string]')) {
    labels.push(label.dataset.string);
  }
  ipcRenderer.send('locale-get-text', labels);
});

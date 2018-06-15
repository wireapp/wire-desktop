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

const {ipcRenderer} = require('electron');
const EVENT_TYPE = require('./lib/eventType');

setTimeout(() => window.alert(), 1000);

ipcRenderer.once(EVENT_TYPE.ABOUT.LOCALE_RENDER, (sender, labels) => {
  console.log('DOM REAPLCE VALUES ', JSON.stringify(labels));
  for (const label in labels) {
    document.querySelector(`[data-string="${label}"]`).innerHTML = labels[label];
  }
});

ipcRenderer.once(EVENT_TYPE.ABOUT.LOADED, (sender, details) => {
  console.log('DOM REALLY READY', JSON.stringify(details));

  document.getElementById('name').innerHTML = details.productName;
  document.getElementById('version').innerHTML = details.electronVersion || 'Development';

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
  ipcRenderer.send(EVENT_TYPE.ABOUT.LOCALE_VALUES, labels);
  console.log('DOM LOCAL VALUES', JSON.stringify(details));
});

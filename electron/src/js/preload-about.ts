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

import {Event, ipcRenderer} from 'electron';
import {EVENT_TYPE} from './lib/eventType';

ipcRenderer.once(EVENT_TYPE.ABOUT.LOCALE_RENDER, (event: Event, labels: string[]) => {
  for (const label in labels) {
    const labelElement = document.querySelector(`[data-string="${label}"]`);
    if (labelElement) {
      labelElement.innerHTML = labels[label];
    }
  }
});

ipcRenderer.once(
  EVENT_TYPE.ABOUT.LOADED,
  (
    event: Event,
    details: {
      electronVersion: string;
      productName: string;
      webappVersion: string;
    }
  ) => {
    const nameElement = document.getElementById('name');
    if (nameElement) {
      nameElement.innerHTML = details.productName;
    }

    const versionElement = document.getElementById('version');
    if (versionElement) {
      versionElement.innerHTML = details.electronVersion || 'Development';
    }

    const webappVersionElement = document.getElementById('webappVersion');
    if (webappVersionElement) {
      if (details.webappVersion) {
        webappVersionElement.innerHTML = details.webappVersion;
      } else {
        if (webappVersionElement.parentNode) {
          (webappVersionElement.parentNode as any).remove();
        }
      }
    }

    // Get locales
    const labels = [];
    const dataStrings = document.querySelectorAll<any>('[data-string]');

    for (const index in dataStrings) {
      const label = dataStrings[index];
      labels.push(label.dataset.string);
    }
    ipcRenderer.send(EVENT_TYPE.ABOUT.LOCALE_VALUES, labels);
  }
);

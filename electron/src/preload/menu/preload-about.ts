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

import {ipcRenderer} from 'electron';

import {EVENT_TYPE} from '../../lib/eventType';

ipcRenderer.once(EVENT_TYPE.ABOUT.LOCALE_RENDER, (_event, labels: Record<string, string>) => {
  for (const [labelName, labelText] of Object.entries(labels)) {
    if (labelName === 'aboutReleasesUrl' || labelName === 'aboutUpdatesUrl') {
      const labelElement = document.querySelector(`[data-href="${labelName}"]`);
      if (labelElement) {
        (labelElement as HTMLAnchorElement).href = labelText;
      }
    } else {
      const labelElement = document.querySelector(`[data-string="${labelName}"]`);
      if (labelElement) {
        (labelElement as HTMLDivElement).textContent = labelText;
      }
    }
  }
});

interface Details {
  copyright: string;
  electronVersion: string;
  productName: string;
  webappVersion: string;
  webappAVSVersion?: string;
}

export function loadedAboutScreen(_event: unknown, details: Details): void {
  const nameElement = document.getElementById('name');
  if (nameElement) {
    nameElement.textContent = details.productName;
  }

  const versionElement = document.getElementById('version');
  if (versionElement) {
    versionElement.textContent = details.electronVersion;
  }

  const webappVersionElement = document.getElementById('webappVersion');
  if (webappVersionElement) {
    webappVersionElement.textContent = details.webappVersion;
  }

  if (details.webappAVSVersion) {
    const webappAVSVersionElement = document.getElementById('webappAVSVersion');
    if (webappAVSVersionElement) {
      webappAVSVersionElement.textContent = details.webappAVSVersion;
    }
  }

  const copyrightElement = document.getElementById('copyright');
  if (copyrightElement) {
    copyrightElement.textContent = details.copyright;
  }

  const logoElement = document.getElementById('logo') as HTMLImageElement;
  if (logoElement) {
    logoElement.src = '../img/logo.256.png';
  }

  // Get locales
  const labels = [];
  const dataStrings = document.querySelectorAll<HTMLDivElement>('[data-string]');

  for (const index in dataStrings) {
    const label = dataStrings[index];
    if (label.dataset) {
      labels.push(label.dataset.string);
    }
  }

  ipcRenderer.send(EVENT_TYPE.ABOUT.LOCALE_VALUES, labels);
}

ipcRenderer.once(EVENT_TYPE.ABOUT.LOADED, loadedAboutScreen);

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
    if (['aboutReleasesUrl', 'aboutUpdatesUrl'].includes(labelName)) {
      const labelElement = document.querySelector(`[data-href="${labelName}"]`);
      if (labelElement !== null) {
        (labelElement as HTMLAnchorElement).href = labelText;
      }
    } else {
      const labelElement = document.querySelector(`[data-string="${labelName}"]`);
      if (labelElement !== null) {
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

function renderWebappVersions(details: Pick<Details, 'webappVersion' | 'webappAVSVersion'>): void {
  const webappVersionElement = document.getElementById('webappVersion');
  if (webappVersionElement !== null) {
    webappVersionElement.textContent = details.webappVersion;
  }

  const webappAVSVersionElement = document.getElementById('webappAVSVersion');
  if (webappAVSVersionElement !== null) {
    webappAVSVersionElement.textContent = details.webappAVSVersion !== undefined ? details.webappAVSVersion : '';
  }
}

export function loadedAboutScreen(_event: unknown, details: Details): void {
  const nameElement = document.getElementById('name');
  if (nameElement !== null) {
    nameElement.textContent = details.productName;
  }

  const versionElement = document.getElementById('version');
  if (versionElement !== null) {
    versionElement.textContent = details.electronVersion;
  }

  renderWebappVersions(details);

  const copyrightElement = document.getElementById('copyright');
  if (copyrightElement !== null) {
    copyrightElement.textContent = details.copyright;
  }

  const logoElement = document.getElementById('logo');
  if (logoElement instanceof HTMLImageElement) {
    logoElement.src = '../img/logo.256.png';
  }

  // Get locales
  const labels: string[] = [];
  const dataStrings = document.querySelectorAll<HTMLDivElement>('[data-string]');

  for (const label of Array.from(dataStrings)) {
    const localeLabel = label.dataset.string;
    if (localeLabel !== undefined) {
      labels.push(localeLabel);
    }
  }

  ipcRenderer.send(EVENT_TYPE.ABOUT.LOCALE_VALUES, labels);
}

export function updateAboutScreenVersions(_event: unknown, details: Details): void {
  renderWebappVersions(details);
}

ipcRenderer.once(EVENT_TYPE.ABOUT.LOADED, loadedAboutScreen);
ipcRenderer.on(EVENT_TYPE.ABOUT.LOADED, updateAboutScreenVersions);

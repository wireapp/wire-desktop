/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import {IpcMessageEvent, ipcRenderer} from 'electron';

import {EVENT_TYPE} from '../../lib/eventType';

ipcRenderer.once(EVENT_TYPE.PROXY_PROMPT.LOCALE_RENDER, (event: IpcMessageEvent, labels: string[]) => {
  for (const label in labels) {
    const labelElement = document.querySelector(`[data-string="${label}"]`);
    if (labelElement) {
      labelElement.innerHTML = labels[label];
    }
  }
});

export function loadedPrompt(): void {
  const labels = [];
  const dataStrings = document.querySelectorAll<HTMLDivElement>('[data-string]');

  for (const index in dataStrings) {
    const label = dataStrings[index];
    if (label.dataset) {
      labels.push(label.dataset.string);
    }
  }

  ipcRenderer.send(EVENT_TYPE.PROXY_PROMPT.LOCALE_VALUES, labels);
}

ipcRenderer.once(EVENT_TYPE.PROXY_PROMPT.LOADED, loadedPrompt);

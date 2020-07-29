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

import {ipcRenderer} from 'electron';

import {EVENT_TYPE} from '../../lib/eventType';

ipcRenderer.once(EVENT_TYPE.PROXY_PROMPT.LOCALE_RENDER, (event, labels: string[]) => {
  for (const label in labels) {
    const labelElement = document.querySelector(`[data-string="${label}"]`);
    if (labelElement) {
      labelElement.textContent = labels[label];
    }
  }
});

ipcRenderer.once(EVENT_TYPE.PROXY_PROMPT.LOADED, () => {
  const labels = [];
  const dataStrings = document.querySelectorAll<HTMLDivElement>('[data-string]');

  for (const index in dataStrings) {
    const label = dataStrings[index];
    if (label.dataset) {
      labels.push(label.dataset.string);
    }
  }

  ipcRenderer.send(EVENT_TYPE.PROXY_PROMPT.LOCALE_VALUES, labels);

  const okButton = document.querySelector<HTMLButtonElement>('#okButton');
  const cancelButton = document.querySelector<HTMLButtonElement>('#cancelButton');
  const usernameInput = document.querySelector<HTMLInputElement>('#usernameInput');
  const passwordInput = document.querySelector<HTMLInputElement>('#passwordInput');
  const form = document.querySelector<HTMLInputElement>('#form');

  if (cancelButton && okButton && usernameInput && passwordInput && form) {
    usernameInput.focus();

    const sendData = (): void => {
      ipcRenderer.send(EVENT_TYPE.PROXY_PROMPT.SUBMITTED, {
        password: passwordInput.value,
        username: usernameInput.value,
      });
      window.close();
    };

    cancelButton.addEventListener('click', () => {
      ipcRenderer.send(EVENT_TYPE.PROXY_PROMPT.CANCELED);
      window.close();
    });

    form.addEventListener('submit', () => sendData());

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        ipcRenderer.send(EVENT_TYPE.PROXY_PROMPT.CANCELED);
        window.close();
      }
    });
  }
});

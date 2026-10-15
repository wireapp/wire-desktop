/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

window.addEventListener('DOMContentLoaded', async () => {
  const data = await ipcRenderer.invoke('wire:text-prompt:init');
  if (!data) {
    window.close();
    return;
  }
  document.title = data.title;
  document.querySelector('#title')!.textContent = data.title;
  const input = document.querySelector<HTMLInputElement>('#value')!;
  document.querySelector('#origin')!.textContent = data.origin;
  document.querySelector('#message')!.textContent = data.message;
  document.querySelector('#ok')!.textContent = data.ok;
  document.querySelector('#cancel')!.textContent = data.cancel;
  input.value = data.defaultValue;
  let sent = false;
  const finish = (value: string | null): void => {
    if (!sent) {
      sent = true;
      ipcRenderer.send('wire:text-prompt:result', value);
    }
  };
  document.querySelector('form')!.addEventListener('submit', event => {
    event.preventDefault();
    finish(input.value);
  });
  document.querySelector('#cancel')!.addEventListener('click', () => finish(null));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      finish(null);
    }
  });
  input.focus();
  input.select();
});

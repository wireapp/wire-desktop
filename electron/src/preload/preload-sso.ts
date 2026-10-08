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

// Sandboxed preload: only Electron's limited built-in module is available here.
import {contextBridge, ipcRenderer} from 'electron';

let completion: Promise<unknown> = Promise.resolve();
contextBridge.exposeInMainWorld('__wireSsoOpener', {
  postMessage: (message: {type?: unknown; payload?: unknown}) => {
    completion = ipcRenderer.invoke('wire:sso-complete', message?.type, message?.payload).catch(() => false);
    return completion;
  },
  close: () => {
    void completion.then(() => ipcRenderer.send('wire:sso-close'));
  },
});
contextBridge.executeInMainWorld({
  func: () => {
    if (!window.opener) {
      const bridge = (
        window as unknown as {
          __wireSsoOpener: {postMessage: (message: unknown) => void; close: () => void};
        }
      ).__wireSsoOpener;
      // Provide only the backend's completion API, not access to another account.
      Object.defineProperty(window, 'opener', {
        value: {postMessage: (message: unknown) => bridge.postMessage(message)},
      });
      window.close = () => bridge.close();
    }
  },
});

contextBridge.exposeInMainWorld('__wireTextPrompt', (message = '', defaultValue = ''): string | null => {
  return ipcRenderer.sendSync('wire:text-prompt', String(message), String(defaultValue));
});
contextBridge.executeInMainWorld({
  func: () => {
    window.prompt = (message = '', defaultValue = '') => {
      const bridge = window as unknown as {__wireTextPrompt: (message: string, value: string) => string | null};
      return bridge.__wireTextPrompt(String(message), String(defaultValue));
    };
  },
});

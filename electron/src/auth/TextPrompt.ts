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

import {app, BrowserWindow, IpcMainEvent} from 'electron';

import path from 'path';
import {pathToFileURL} from 'url';

import {getText} from '../locale';
import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger('TextPrompt');
const registered = new WeakSet<BrowserWindow>();
const limit = 4096;

// Synchronous browser prompt semantics, with an independent local dialog renderer.
export function registerTextPrompt(parent: BrowserWindow): void {
  if (registered.has(parent)) {
    return;
  }
  registered.add(parent);
  const contents = parent.webContents;
  let active = false;
  contents.ipc.on('wire:text-prompt', (event: IpcMainEvent, message: unknown, defaultValue: unknown) => {
    const frame = event.senderFrame;
    let origin: string;
    try {
      const url = new URL(frame?.url || '');
      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error('Unsupported prompt origin');
      }
      origin = url.origin;
    } catch {
      event.returnValue = null;
      return;
    }
    if (
      active ||
      parent.isDestroyed() ||
      frame !== contents.mainFrame ||
      typeof message !== 'string' ||
      typeof defaultValue !== 'string' ||
      message.length > limit ||
      defaultValue.length > limit
    ) {
      event.returnValue = null;
      return;
    }
    active = true;
    const requestUrl = frame.url;
    const base = path.join(app.getAppPath(), config.electronDirectory);
    const page = pathToFileURL(path.join(base, 'html/text-prompt.html')).href;
    let prompt: BrowserWindow | undefined;
    let finished = false;
    const finish = (value: string | null = null): void => {
      if (finished) {
        return;
      }
      finished = true;
      active = false;
      contents.removeListener('did-start-navigation', navigated);
      contents.removeListener('render-process-gone', cancelled);
      parent.removeListener('closed', cancelled);
      // A synchronous IPC reply must not target a renderer/frame being torn down.
      if (!contents.isDestroyed() && !frame.detached && frame.url === requestUrl) {
        event.returnValue = value;
      }
      // Parent destruction can also close this modal. Avoid re-entering native
      // window destruction from a closed/render-process-gone callback on Linux.
      const dialog = prompt;
      setImmediate(() => {
        if (dialog && !dialog.isDestroyed()) {
          dialog.destroy();
        }
      });
      logger.info('[Passkeys] Website text prompt closed.');
    };
    const cancelled = (): void => finish();
    const navigated = (_event: Electron.Event, _url: string, _inPlace: boolean, mainFrame: boolean): void => {
      if (mainFrame) {
        finish();
      }
    };
    try {
      prompt = new BrowserWindow({
        parent,
        modal: true,
        show: false,
        width: 480,
        height: 380,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: getText('textPromptTitle'),
        webPreferences: {
          preload: path.join(base, 'dist/preload/preload-text-prompt.js'),
          contextIsolation: true,
          sandbox: true,
          nodeIntegration: false,
          partition: 'wire-text-prompt',
          webviewTag: false,
        },
      });
      const dialog = prompt;
      dialog.setMenuBarVisibility(false);
      dialog.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
      dialog.webContents.on('will-navigate', event => event.preventDefault());
      dialog.webContents.on('will-redirect', event => event.preventDefault());
      const isDialog = (sender: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): boolean =>
        sender.senderFrame === dialog.webContents.mainFrame && sender.senderFrame?.url === page;
      dialog.webContents.ipc.handle('wire:text-prompt:init', event =>
        isDialog(event)
          ? {
              title: getText('textPromptTitle'),
              origin,
              message,
              defaultValue,
              ok: getText('promptOK'),
              cancel: getText('promptCancel'),
            }
          : null,
      );
      dialog.webContents.ipc.on('wire:text-prompt:result', (event, value: unknown) => {
        if (isDialog(event)) {
          finish(typeof value === 'string' && value.length <= limit ? value : null);
        }
      });
      dialog.on('closed', cancelled);
      dialog.webContents.on('render-process-gone', cancelled);
      contents.on('did-start-navigation', navigated);
      contents.on('render-process-gone', cancelled);
      parent.on('closed', cancelled);
      void dialog
        .loadURL(page)
        .then(() => {
          if (!finished && !dialog.isDestroyed()) {
            dialog.show();
          }
        })
        .catch(cancelled);
      logger.info('[Passkeys] Showing website text prompt.');
    } catch {
      finish();
    }
  });
}

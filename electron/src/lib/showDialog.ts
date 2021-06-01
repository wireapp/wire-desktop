/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import {dialog, MessageBoxSyncOptions, ipcMain} from 'electron';
import * as locale from '../locale/locale';
import {EVENT_TYPE} from './eventType';

export const showDialog = (message: string, title: string, type?: string, detail?: string): void => {
  const options: MessageBoxSyncOptions = {
    detail,
    message,
    title,
    type,
  };
  dialog.showMessageBoxSync(options);
};

export const showErrorDialog = (message: string): void => {
  showDialog(message, locale.getText('promptError'), 'error');
};

export const showWarningDialog = (message: string): void => {
  const options: MessageBoxSyncOptions = {
    buttons: [locale.getText('promptOK')],
    message,
    title: locale.getText('promptWarning'),
    type: 'warning',
  };
  dialog.showMessageBoxSync(options);
};

ipcMain.handle(EVENT_TYPE.IPC.SHOW_DIALOG, (_event, message: string, title: string, type?: string, detail?: string) => {
  showDialog(message, title, type, detail);
});

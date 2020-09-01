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

import {dialog, MessageBoxSyncOptions} from 'electron';
import * as locale from '../locale/locale';

export const showDialog = (message: string, title: string, type?: string): void => {
  const options: MessageBoxSyncOptions = {
    message,
    title,
    type,
  };
  dialog.showMessageBoxSync(options);
};

export const showErrorDialog = (message: string): void => {
  showDialog(message, 'Error', 'error');
};

export const showWarningDialog = (message: string): void => {
  const options: MessageBoxSyncOptions = {
    buttons: ['OK'],
    message,
    title: 'Warning',
    type: 'warning',
  };
  dialog.showMessageBoxSync(options);
};

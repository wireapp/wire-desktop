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

export const changeEnvironmentPrompt = (url: string): boolean => {
  const cancelButton = locale.getText('changeEnvironmentModalCancel');
  const confirmButton = locale.getText('changeEnvironmentModalConfirm');
  const buttons = [confirmButton, cancelButton];

  const options: MessageBoxSyncOptions = {
    buttons,
    cancelId: buttons.indexOf(cancelButton),
    defaultId: buttons.indexOf(cancelButton),
    message: locale.getText('changeEnvironmentModalText', {url}),
    title: locale.getText('changeEnvironmentModalTitle'),
    type: 'info',
  };
  const buttonIndex = dialog.showMessageBoxSync(options);
  return buttons[buttonIndex] === confirmButton;
};

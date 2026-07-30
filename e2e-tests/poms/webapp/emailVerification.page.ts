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

import {Page} from '@playwright/test';

export const emailVerificationPage = (page: Page) => {
  const verificationCodeInput = page.getByRole('group', {name: 'Six-digit code'});

  const verificationCodeInputs = verificationCodeInput.getByRole('textbox');
  const enterVerificationCode = async (code: string) => {
    const inputs = await verificationCodeInputs.all();
    for (let i = 0; i < inputs.length; i++) {
      await inputs[i].press(code[i]);
    }
  };

  return {verificationCodeInput, enterVerificationCode};
};

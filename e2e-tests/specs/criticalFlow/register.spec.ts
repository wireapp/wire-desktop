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

import {expect, test} from '../../fixtures';
import {ssoPage} from '../../poms/webapp/sso.page';
import {createUser} from '../../utils/createUser';

test('I want to register a new Wire account', {tag: ['@TC-10924', '@crit-flow-web']}, async ({page}) => {
  const user = createUser();
  await ssoPage(page).codeEmailInput.fill(user.email);
  await ssoPage(page).loginButton.click();

  await expect(page.getByRole('button', {name: 'Create account'})).toBeVisible();
});

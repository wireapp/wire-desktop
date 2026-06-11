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
import {accountsSidebar} from '../../poms/app/accountsSidebar.page';
import {conversationsSidebar} from '../../poms/webapp/conversationsSidebar.page';
import {LOGIN_TIMEOUT, loginPage} from '../../poms/webapp/login.page';
import {ssoPage} from '../../poms/webapp/sso.page';

test(
  'I want to log in with my existing Wire account',
  {tag: ['@TC-10923', '@crit-flow-desktop']},
  async ({app, page, createUser}) => {
    const user = await createUser();

    await test.step('User logs in', async () => {
      await ssoPage(page).codeEmailInput.fill(user.email);
      await ssoPage(page).loginButton.click();

      await loginPage(page).passwordInput.fill(user.password);
      await loginPage(page).loginButton.click();
    });

    await test.step("User verifies he's now logged in with his new account", async () => {
      await expect(conversationsSidebar(page).userAvatar).toContainText(user.initials, {timeout: LOGIN_TIMEOUT});
      await expect(accountsSidebar(app).getAccount(user)).toBeVisible();
    });
  },
);

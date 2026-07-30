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

import {loginUser} from '../../actions/loginUser';
import {expect, test} from '../../fixtures';
import {accountsSidebar} from '../../poms/app/accountsSidebar.page';
import {conversationsSidebar} from '../../poms/webapp/conversationsSidebar.page';
import {ssoPage} from '../../poms/webapp/sso.page';

test(
  'I want to add multiple accounts to the app and switch between them',
  {tag: ['@TC-10925', '@crit-flow-desktop']},
  async ({app, createUser}) => {
    const userA = await createUser();
    const userA2 = await createUser();

    await test.step('UserA logs in', async () => {
      await loginUser(app.page, userA);
    });

    await test.step('UserA verifies they are logged in', async () => {
      await expect(conversationsSidebar(app.page).userAvatar).toContainText(userA.initials);
      await expect(accountsSidebar(app).getAccount(userA)).toBeVisible();
    });

    await test.step('UserA clicks on `+` button to add new account', async () => {
      await accountsSidebar(app).addAccount();

      await expect(ssoPage(app.page).loginButton).toBeVisible();
      await expect(app.page.getByText('Welcome to Wire!')).toBeVisible();
    });

    await test.step('UserA logs in with second account', async () => {
      await loginUser(app.page, userA2);
      await expect(conversationsSidebar(app.page).userAvatar).toContainText(userA2.initials);
      await expect(accountsSidebar(app).getAccount(userA)).toBeVisible();
      await expect(accountsSidebar(app).getAccount(userA2)).toBeVisible();
      await expect(accountsSidebar(app).accountItems).toHaveCount(2);
    });

    await test.step('UserA clicks on first account in the accounts list', async () => {
      await accountsSidebar(app).switchAccount(0);
      await expect(conversationsSidebar(app.page).userAvatar).toContainText(userA.initials);
    });
  },
);

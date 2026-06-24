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

import {createGroup} from '../../actions/createGroup';
import {loginUser} from '../../actions/loginUser';
import {expect, test} from '../../fixtures';
import {accountsSidebar} from '../../poms/app/accountsSidebar.page';
import {conversationsList} from '../../poms/webapp/conversationList.page';
import {conversationsSidebar} from '../../poms/webapp/conversationsSidebar.page';

test.describe('Multiple Accounts', async () => {
  test(
    'I want to switch between multiple accounts and see correct conversation',
    {tag: ['@TC-11002', '@regression']},
    async ({app, createTeam}) => {
      const userATeam = await createTeam('Multiple Accounts A', {users: []});
      const [userA, userAPage] = [userATeam.owner, app.page];
      const userAGroup = 'User A Group';

      const userBTeam = await createTeam('Multiple Accounts B', {users: []});
      const userB = userBTeam.owner;
      const userBGroup = 'User B Group';

      await test.step('UserA logs in', async () => {
        await loginUser(userAPage, userA);
        await expect(conversationsSidebar(userAPage).userAvatar).toContainText(userA.initials);
      });

      await test.step('UserA creates empty group', async () => {
        await createGroup(userAPage, userAGroup, []);
      });

      await test.step('UserA adds new Account', async () => {
        await accountsSidebar(app).addAccount();
        await loginUser(app.page, userB);
        await expect(conversationsSidebar(app.page).userAvatar).toContainText(userB.initials);
      });

      await test.step('UserB does not see group conversation of UserA', async () => {
        await expect(conversationsList(app.page).getConversation(userAGroup)).not.toBeVisible();
      });

      await test.step('UserB creates empty group', async () => {
        await createGroup(app.page, userBGroup, []);
      });

      await test.step('UserB switches account back to A', async () => {
        await accountsSidebar(app).switchAccount(0);
      });

      await test.step('UserA does not see group conversation of UserA', async () => {
        await expect(conversationsList(userAPage).getConversation(userBGroup)).not.toBeVisible();
      });
    },
  );

  test(
    'I want to remove my secondary account',
    {tag: ['@TC-11003', '@crit-flow-desktop']},
    async ({app, createUser}) => {
      const userA = await createUser();
      const userB = await createUser();

      await test.step('UserA logs in', async () => {
        await loginUser(app.page, userA);
      });

      await test.step('UserA logs in with second account', async () => {
        await accountsSidebar(app).addAccount();
        await loginUser(app.page, userB);
        await expect(accountsSidebar(app).getAccount(userA)).toBeVisible();
        await expect(accountsSidebar(app).getAccount(userB)).toBeVisible();
        await expect(accountsSidebar(app).accountItems).toHaveCount(2);
      });

      await test.step('UserA switches back to main account', async () => {
        await accountsSidebar(app).switchAccount(0);
      });

      await test.step('UserA removes secondary account', async () => {
        await accountsSidebar(app).getAccount(userB).click({button: 'right'});
        await accountsSidebar(app).getByRole('button', {name: 'Remove Account'}).click();
        await expect(accountsSidebar(app).getAccount(userA)).toBeVisible();
        await expect(accountsSidebar(app).getAccount(userB)).not.toBeVisible();
        await expect(accountsSidebar(app).accountItems).toHaveCount(1);
      });
    },
  );
});

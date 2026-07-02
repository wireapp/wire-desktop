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

import {createGroup, loginUser, sendConnectionRequest} from '../../actions';
import {expect, test} from '../../fixtures';
import {accountsSidebar} from '../../poms/app';
import {
  connectionRequestPage,
  conversation,
  conversationsList,
  conversationsSidebar,
  LOGIN_TIMEOUT,
  ssoPage,
} from '../../poms/webapp';

test.describe('Multiple Accounts', async () => {
  test('I want to remove the only account I have', {tag: ['@TC-11070', '@regression']}, async ({app, createUser}) => {
    const userA = await createUser();

    await test.step('UserA logs in', async () => {
      await loginUser(app.page, userA);
    });

    await test.step('UserA removes account', async () => {
      await accountsSidebar(app).removeAccount(0);
    });

    await test.step('UserA gets redirected to SSO-Page', async () => {
      await expect(ssoPage(app.page).loginButton).toBeVisible({timeout: LOGIN_TIMEOUT});
      await expect(app.page.getByText('Welcome to Wire!')).toBeVisible();
    });
  });

  test('I want to remove my secondary account', {tag: ['@TC-11003', '@regression']}, async ({app, createUser}) => {
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
      await accountsSidebar(app).removeAccount(1);
      await expect(accountsSidebar(app).getAccount(userA)).toBeVisible({timeout: LOGIN_TIMEOUT});
      await expect(accountsSidebar(app).getAccount(userB)).not.toBeVisible();
      await expect(accountsSidebar(app).accountItems).toHaveCount(1);
    });
  });

  test('I want to remove my active account', {tag: ['@TC-11004', '@regression']}, async ({app, createUser}) => {
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

    await test.step('UserA removes active main account', async () => {
      await accountsSidebar(app).removeAccount(0);
      await expect(accountsSidebar(app).getAccount(userB)).toBeVisible();
      await expect(accountsSidebar(app).getAccount(userA)).not.toBeVisible();
      await expect(accountsSidebar(app).accountItems).toHaveCount(1);
      await expect(conversationsSidebar(app.page).userAvatar).toContainText(userB.initials);
    });
  });

  test('Verify max account limit of three accounts', {tag: ['@TC-11005', '@regression']}, async ({app, createUser}) => {
    const userA = await createUser();
    const userB = await createUser();
    const userC = await createUser();

    await test.step('Preconditions: UserA and UserB are already logged in', async () => {
      await loginUser(app.page, userA);
      await accountsSidebar(app).addAccount();
      await loginUser(app.page, userB);
    });

    await test.step('Verify `+` is still visible', async () => {
      await accountsSidebar(app).getAccount(userB).hover();
      await expect(accountsSidebar(app).addAccountButton).toBeVisible();
    });

    await test.step('UserA adds third account', async () => {
      await accountsSidebar(app).addAccount();
      await loginUser(app.page, userC);
    });

    await test.step('Verify `+` is no longer visible', async () => {
      await accountsSidebar(app).getAccount(userB).hover();
      await expect(accountsSidebar(app).addAccountButton).not.toBeVisible();
    });
  });

  test('Verify correct account gets notified', {tag: ['@TC-11006', '@regression']}, async ({app, createUser}) => {
    const userA = await createUser();
    const userB = await createUser();
    const conversationName = 'MultiAcc';

    await test.step('UserA logs in', async () => {
      await loginUser(app.page, userA);
    });

    await test.step('UserA connects with UserB', async () => {
      await sendConnectionRequest(app.page, userB);
    });

    await test.step('UserA adds account for UserB and UserB accepts connection request', async () => {
      await accountsSidebar(app).addAccount();
      await loginUser(app.page, userB);
      await connectionRequestPage(app.page).connectButton.click();
      await accountsSidebar(app).switchAccount(0);
      await expect(conversationsSidebar(app.page).userAvatar).toContainText(userA.initials);
    });

    await test.step('UserA creates group conversation with UserB', async () => {
      await createGroup(app.page, conversationName, [userB]);
    });

    await test.step('UserA sends message to group conversation', async () => {
      await conversationsList(app.page).getConversation(conversationName).open();
      await conversation(app.page).sendMessage('Papaya');
    });

    await test.step('Notification Dot on UserB profile in sidebar is visible', async () => {
      await expect(accountsSidebar(app).getAccount(userB).notificationDot).toBeVisible();
    });

    await test.step('UserA switches to UserB account, reads message and notification dot vanishes', async () => {
      await accountsSidebar(app).switchAccount(1);
      await conversationsList(app.page).getConversation(conversationName).open();
      await expect(accountsSidebar(app).getAccount(userB).notificationDot).toBeHidden();
    });

    await test.step('UserB sends message to group conversation', async () => {
      await conversationsList(app.page).getConversation(conversationName).open();
      await conversation(app.page).sendMessage('Guava');
    });

    await test.step('Notification Dot on UserA profile in sidebar is visible', async () => {
      await expect(accountsSidebar(app).getAccount(userA).notificationDot).toBeVisible();
    });

    await test.step('UserB switches to UserA account, reads message and notification dot vanishes', async () => {
      await accountsSidebar(app).switchAccount(0);
      await conversationsList(app.page).getConversation(conversationName).open();
      await expect(accountsSidebar(app).getAccount(userA).notificationDot).toBeHidden();
    });
  });
});

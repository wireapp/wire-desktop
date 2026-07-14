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

import * as fs from 'fs';
import * as path from 'path';

import {connectWithUser} from '../../actions/connectWithUser';
import {loginUser, loginUserAfterDataCleanup} from '../../actions/loginUser';
import {watchActiveAccount} from '../../actions/watchActiveAccount';
import {expect, test} from '../../fixtures';
import {accountsSidebar} from '../../poms/app/accountsSidebar.page';
import {conversation} from '../../poms/webapp/conversation.page';
import {conversationsList} from '../../poms/webapp/conversationList.page';
import {conversationsSidebar} from '../../poms/webapp/conversationsSidebar.page';
import {logoutModal} from '../../poms/webapp/logoutModal.page';

test('Logout flow', {tag: ['@TC-11286', '@crit-flow-desktop']}, async ({app, createUser, createTeam, createPage}) => {
  test.setTimeout(150_000); // This test has to complete 3 logins which may take more than the default timeout of 90s

  const userB = await createUser();
  const {owner: userA} = await createTeam('Test Team', {users: [userB]});
  const userBPage = await createPage();

  await Promise.all([loginUser(app.page, userA), loginUser(userBPage, userB)]);
  await connectWithUser(app.page, userB);

  await conversationsList(app.page).getConversation(userB.fullName, {protocol: 'mls'}).open();
  await conversationsList(userBPage).getConversation(userA.fullName, {protocol: 'mls'}).open();

  await test.step('User B sends a message to User A', async () => {
    await conversation(userBPage).sendMessage('Test message');
    await expect(conversation(app.page).getMessage({content: 'Test message'})).toBeVisible();
  });

  await test.step("User right-clicks on the Account A's avatar on the sidebar with accounts' avatars", async () => {
    await accountsSidebar(app).accountItems.first().click({button: 'right'});
    await expect(accountsSidebar(app).logoutButton).toBeVisible();
    await expect(accountsSidebar(app).removeAccountButton).toBeVisible();
  });

  await test.step("User clicks 'Log out' option", async () => {
    await accountsSidebar(app).logoutButton.click();
    await expect(logoutModal(app).title).toHaveText('Clear Data?');
  });

  await test.step("User clicks 'Cancel' button on the popup", async () => {
    await logoutModal(app).cancelButton.click();
    await expect(logoutModal(app).title).toBeHidden();
  });

  await test.step("User clicks 'Log out' option again and click close button (cross icon)", async () => {
    // TODO (WPB-26936): Remove this workaround once the issue is resolved
    await accountsSidebar(app).sidebar.click();

    await accountsSidebar(app).accountItems.first().click({button: 'right'});
    await accountsSidebar(app).logoutButton.click();

    await logoutModal(app).closeButton.click();
    await expect(logoutModal(app).title).toBeHidden();
  });

  await test.step("User clicks 'Log out' option again and User clicks 'Log Out' button on the popup", async () => {
    // TODO (WPB-26936): Remove this workaround once the issue is resolved
    await accountsSidebar(app).sidebar.click();

    await accountsSidebar(app).accountItems.first().click({button: 'right'});
    await accountsSidebar(app).logoutButton.click();

    await logoutModal(app).logoutButton.click();
    await expect(app.page.getByText('Welcome to Wire!')).toBeVisible();
  });

  await test.step('User logs in into Account A again', async () => {
    await loginUser(app.page, userA);
    await expect(conversationsSidebar(app.page).userAvatar).toContainText(userA.initials);
  });

  await test.step('User A opens the conversation with User B', async () => {
    await conversationsList(app.page).getConversation(userB.fullName, {protocol: 'mls'}).open();
    await expect(conversation(app.page).getMessage({content: 'Test message'})).toBeVisible();
  });

  await test.step('User A logs out checking the Clear Data checkbox', async () => {
    const userDataDir = await app.evaluate(async ({app: electronApp}) => {
      return electronApp.getPath('userData');
    });
    const sessionStorePath = path.join(userDataDir, 'Default', 'Local Storage');

    // TODO (WPB-26936): Remove this workaround once the issue is resolved
    await accountsSidebar(app).sidebar.click();

    await accountsSidebar(app).logOut(0);
    const clearDataCheckbox = logoutModal(app).clearDataCheckbox;
    await expect(clearDataCheckbox).toBeVisible();
    await app.page.getByText('Delete all your personal information').click();
    await expect(clearDataCheckbox).toBeChecked();
    const logoutModalButton = logoutModal(app).logoutButton;

    const [newWindow] = await Promise.all([app.waitForEvent('window'), logoutModalButton.click()]);
    app.page = newWindow;

    await expect(app.page.getByText('Welcome to Wire!')).toBeVisible();

    const isCleaned = !fs.existsSync(sessionStorePath) || fs.readdirSync(sessionStorePath).length === 0;
    expect(isCleaned).toBe(true);
  });

  await test.step('User A logs back in', async () => {
    await loginUserAfterDataCleanup(app.page, userA);
    await conversationsList(app.page).getConversation(userB.fullName, {protocol: 'mls'}).open();
    await expect(conversation(app.page).getMessage({content: 'Test message'})).toBeHidden();
  });
});

test(
  'Logout from the secondary account while the first one is active',
  {tag: ['@TC-11287', '@crit-flow-desktop']},
  async ({app, createUser}) => {
    const userA = await createUser();
    const userB = await createUser();

    await loginUser(app.page, userA);
    await accountsSidebar(app).addAccount();
    await loginUser(app.page, userB);
    await accountsSidebar(app).switchAccount(0);

    await test.step("User right-clicks on the Account B's avatar on the sidebar with accounts' avatars and clicks 'Log out' option", async () => {
      await watchActiveAccount(app, newActivePage => (app.page = newActivePage));
      await accountsSidebar(app).logOut(1);
      const userBAccount = accountsSidebar(app).getAccount(userB);
      const userAAccount = accountsSidebar(app).getAccount(userA);
      await expect(userBAccount.activeBorder).toBeVisible();
      await expect(userAAccount.activeBorder).toBeHidden();
    });

    await test.step("User clicks 'Log Out' button on the popup", async () => {
      await logoutModal(app).logoutButton.click();
      await expect(app.page.getByText('Welcome to Wire!')).toBeVisible();
    });

    await test.step('User switches to Account A and opens the profile sidebar', async () => {
      await accountsSidebar(app).switchAccount(0);
      await expect(conversationsSidebar(app.page).userAvatar).toContainText(userA.initials);
    });
  },
);

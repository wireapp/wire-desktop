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

import {connectWithUser} from '../../actions/connectWithUser';
import {createGroup} from '../../actions/createGroup';
import {loginUser} from '../../actions/loginUser';
import {interceptNotifications} from '../../actions/mockNotifications';
import {test, expect} from '../../fixtures';
import {accountsSidebar} from '../../poms/app/accountsSidebar.page';
import {appIcon} from '../../poms/app/appIcon.page';
import {conversation} from '../../poms/webapp/conversation.page';
import {conversationsList} from '../../poms/webapp/conversationList.page';

test.describe('Notifications', () => {
  test(
    'I want to receive notifications',
    {tag: ['@TC-11266', '@regression']},
    async ({app, createUser, createTeam, createPage}) => {
      const userB = await createUser();
      const {owner: userA} = await createTeam('Test Team', {users: [userB]});
      const userBPage = await createPage();

      await Promise.all([loginUser(app.page, userA), loginUser(userBPage, userB)]);

      await test.step('User B opens a conversation and a group with user A', async () => {
        await connectWithUser(userBPage, userA);
        await createGroup(userBPage, 'Distraction Group', [userA]);
      });

      await test.step('User A opens the distraction group', async () => {
        await conversationsList(app.page).getConversation('Distraction Group').open();
      });

      await test.step('User A should have zero unread messages', async () => {
        await expect.poll(() => appIcon(app).getBadgeCount()).toBe(0);
      });

      const {clickNotification} = await interceptNotifications(app);

      await test.step('User B sends a message to A in 1:1', async () => {
        await conversationsList(userBPage).getConversation(userA.fullName, {protocol: 'mls'}).open();
        await conversation(userBPage).sendMessage('Test Message 1');
      });

      await test.step('User A should see one unread message on the app icon', async () => {
        await expect.poll(() => appIcon(app).getBadgeCount()).toEqual(1);
      });

      await test.step('User B sends an other message into a group with A', async () => {
        await createGroup(userBPage, 'Test Group', [userA]);
        await conversationsList(userBPage).getConversation('Test Group').open();
        await conversation(userBPage).sendMessage('Test Message 2');
      });

      await test.step('User A should see two unread messages on the app icon', async () => {
        await expect.poll(() => appIcon(app).getBadgeCount()).toEqual(2);
      });

      await test.step('The number on the app icon should return to 1 when the message is read', async () => {
        await clickNotification({body: 'Test Message 1'});
        await expect(conversation(app.page).conversationTitle).toContainText(userB.fullName);
        await expect.poll(() => appIcon(app).getBadgeCount()).toEqual(1);
      });
    },
  );

  test(
    "I don't want to receive notifications for messages in the conversation I have currently open",
    {tag: ['@TC-11269', '@regression']},
    async ({app, createUser, createTeam, createPage}) => {
      const userB = await createUser();
      const {owner: userA} = await createTeam('Test Team', {users: [userB]});
      const userBPage = await createPage();

      await Promise.all([loginUser(app.page, userA), loginUser(userBPage, userB)]);
      await connectWithUser(app.page, userB);

      await conversationsList(app.page).getConversation(userB.fullName, {protocol: 'mls'}).open();
      await conversationsList(userBPage).getConversation(userA.fullName, {protocol: 'mls'}).open();

      const {getNotifications} = await interceptNotifications(app);

      await conversation(userBPage).sendMessage('Test Message');

      await expect(conversation(app.page).getMessage({content: 'Test Message'})).toBeVisible();
      await expect.poll(() => getNotifications()).not.toContainEqual(expect.objectContaining({body: 'Test Message'}));
    },
  );

  test(
    'I want to receive notifications from multiple accounts',
    {tag: ['@TC-11268', '@regression']},
    async ({app, createUser, createTeam, createPage}) => {
      const userA1 = await createUser();
      const userA2 = await createUser();
      const {owner: userB} = await createTeam('Test Team', {users: [userA1, userA2]});
      const userBPage = await createPage();

      await Promise.all([loginUser(app.page, userA1), loginUser(userBPage, userB)]);
      await connectWithUser(userBPage, userA1);
      await connectWithUser(userBPage, userA2);

      await createGroup(app.page, 'Distraction Group', []);
      await conversationsList(app.page).getConversation('Distraction Group').open();

      await accountsSidebar(app).addAccount();
      await loginUser(app.page, userA2);
      await createGroup(app.page, 'Distraction Group', []);
      await conversationsList(app.page).getConversation('Distraction Group').open();

      const {clickNotification} = await interceptNotifications(app);

      await test.step('B sends a message to user As first account', async () => {
        await conversationsList(userBPage).getConversation(userA1.fullName, {protocol: 'mls'}).open();
        await conversation(userBPage).sendMessage('Test Message 1');

        await expect(accountsSidebar(app).getAccount(userA1).notificationDot).toBeVisible();
        await expect.poll(() => appIcon(app).getBadgeCount()).toBe(1);
      });

      await test.step('B sends a message to user As second account', async () => {
        await conversationsList(userBPage).getConversation(userA2.fullName, {protocol: 'mls'}).open();
        await conversation(userBPage).sendMessage('Test Message 2');

        await expect(accountsSidebar(app).getAccount(userA2).notificationDot).toBeVisible();
        await expect.poll(() => appIcon(app).getBadgeCount()).toBe(2);
      });

      await test.step('A clicks on the notification of the first message', async () => {
        await clickNotification({body: 'Test Message 1'});

        // ToDo: Figure out which webview is the currently active one to verify the switch by click worked
        await expect(conversation(app.page).conversationTitle).toContainText(userB.fullName);
        await expect(accountsSidebar(app).getAccount(userA1).notificationDot).not.toBeVisible();
        await expect.poll(() => appIcon(app).getBadgeCount()).toBe(1);
      });
    },
  );
});

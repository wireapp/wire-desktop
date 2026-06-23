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
import {appIcon} from '../../poms/app/appIcon.page';
import {conversation} from '../../poms/webapp/conversation.page';
import {conversationsList} from '../../poms/webapp/conversationList.page';

test.describe('Notifications', () => {
  test('I want to see the unread messages count on the wire app icon update', async ({
    app,
    createUser,
    createTeam,
    createPage,
  }) => {
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
      await conversationsList(app.page).getConversation(userB.fullName, {protocol: 'mls'}).open();
      await expect.poll(() => appIcon(app).getBadgeCount()).toEqual(1);
    });
  });

  test('I want to open the conversation by clicking on the notification I received', async ({
    app,
    createUser,
    createTeam,
    createPage,
  }) => {
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

    const {getNotifications, clickNotification} = await interceptNotifications(app);

    await test.step('User B sends a message to A in 1on1', async () => {
      await conversationsList(userBPage).getConversation(userA.fullName, {protocol: 'mls'}).open();
      await conversation(userBPage).sendMessage('Test Message');
    });

    await test.step('User A should see one notification', async () => {
      await expect.poll(() => getNotifications()).toMatchObject([{body: 'Test Message'}]);
    });

    await test.step('User A should change the conversation when he clicks the notification', async () => {
      await clickNotification({body: 'Test Message'});
      await expect(conversation(app.page).conversationTitle).toContainText(userB.fullName);
    });
  });
});

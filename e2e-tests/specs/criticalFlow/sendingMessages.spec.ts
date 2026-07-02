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

import {connectWithUser, createGroup, loginUser} from '../../actions';
import {test, expect} from '../../fixtures';
import {conversation, conversationsList} from '../../poms/webapp';

test(
  'I want to exchange text messages with other users',
  {tag: ['@TC-10927', '@crit-flow-desktop']},
  async ({app, createUser, createTeam, createPage}) => {
    const userB = await createUser();
    const {owner: userA} = await createTeam('Test Team', {users: [userB]});
    const userBPage = await createPage();

    await Promise.all([loginUser(app.page, userA), loginUser(userBPage, userB)]);
    await connectWithUser(app.page, userB);

    await conversationsList(app.page).getConversation(userB.fullName, {protocol: 'mls'}).open();
    await conversationsList(userBPage).getConversation(userA.fullName, {protocol: 'mls'}).open();

    await test.step('A sends a message to B directly', async () => {
      await conversation(app.page).sendMessage('Hello B');
      await expect(conversation(userBPage).getMessage({content: 'Hello B'})).toBeVisible();
    });

    await test.step('B also sends a message to A directly', async () => {
      await conversation(userBPage).sendMessage('Hello A');
      await expect(conversation(app.page).getMessage({content: 'Hello A'})).toBeVisible();
    });

    await test.step('A creates a group chat with B as member', async () => {
      await createGroup(app.page, 'Group chat', [userB]);
      await conversationsList(app.page).getConversation('Group chat').open();
      await conversationsList(userBPage).getConversation('Group chat').open();
    });

    await test.step('A sends a message to B in the group chat', async () => {
      await conversation(app.page).sendMessage('Hello B in Group');
      await expect(conversation(userBPage).getMessage({content: 'Hello B in Group'})).toBeVisible();
    });

    await test.step('B also sends a message to A in the group chat', async () => {
      await conversation(userBPage).sendMessage('Hello A in Group');
      await expect(conversation(app.page).getMessage({content: 'Hello A in Group'})).toBeVisible();
    });
  },
);

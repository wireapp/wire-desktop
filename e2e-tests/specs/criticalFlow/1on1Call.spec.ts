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
import {loginUser} from '../../actions/loginUser';
import {expect, test} from '../../fixtures';
import {callCell} from '../../poms/webapp/callCell.page';
import {conversation} from '../../poms/webapp/conversation.page';
import {conversationsList} from '../../poms/webapp/conversationList.page';

test(
  'I want to call someone directly',
  {tag: ['@TC-10926', '@crit-flow-desktop']},
  async ({page: userAPage, createUser, createTeam, createPage}) => {
    const userB = await createUser();
    const {owner: userA} = await createTeam('Test Team', {users: [userB]});
    const userBPage = await createPage();

    await Promise.all([loginUser(userAPage, userA), loginUser(userBPage, userB)]);
    await connectWithUser(userAPage, userB);

    await test.step('User A calls user B', async () => {
      await conversationsList(userAPage).getConversation(userB.fullName).open();
      await conversation(userAPage).startCallButton.click();
      await expect(callCell(userAPage)).toBeVisible();
    });

    await test.step('User B sees call and picks up', async () => {
      await expect(callCell(userBPage)).toBeVisible();
      await callCell(userBPage).acceptCallButton.click();
    });

    await test.step('A and B should see the call with each other', async () => {
      await expect(callCell(userAPage).goFullScreen).toBeVisible();
      await expect(callCell(userBPage).goFullScreen).toBeVisible();
    });
  },
);

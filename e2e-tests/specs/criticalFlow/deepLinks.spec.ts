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

import open from 'open';

import {connectWithUser} from '../../actions/connectWithUser';
import {createGroup} from '../../actions/createGroup';
import {loginUser} from '../../actions/loginUser';
import {expect, test} from '../../fixtures';
import {conversationsList} from '../../poms/webapp/conversationList.page';

test('Open a profile via deep link', {tag: ['@TC-11273', '@crit-flow-desktop']}, async ({app, createUser}) => {
  const user = await createUser();
  await loginUser(app.page, user);

  await test.step('User opens the prepared deep link outside of the application', async () => {
    await open(`wire://user/${user.id}`);
    const popupLabel = await app.page.getByTestId('status-label').textContent();
    await expect(popupLabel).toBe(user.fullName);
    await expect(app.page.getByTestId('go-profile')).toBeVisible();
  });
});

test(
  'Join a group conversation via deep link',
  {tag: ['@TC-11276', '@crit-flow-desktop']},
  async ({app, createUser, createTeam, createPage}) => {
    const userB = await createUser();

    const {owner: userA} = await createTeam('Test Team', {users: [userB]});
    const userAPage = await createPage();

    await Promise.all([loginUser(app.page, userB), loginUser(userAPage, userA)]);

    await connectWithUser(userAPage, userB);

    await test.step('User A creates a group chat with no members', async () => {
      await createGroup(userAPage, 'Group chat', []);
    });

    await test.step('User A opens the Group chat', async () => {
      await conversationsList(userAPage).getConversation('Group chat').open();
    });

    await test.step('User A clicks the "Invite" button', async () => {
      await userAPage.getByTestId('do-invite-people').click();
    });

    await test.step('User A clicks the "Not password secured" option', async () => {
      await userAPage.getByText('Not password secured').click();
    });

    await test.step('User A clicks "Create link"', async () => {
      await userAPage.getByTestId('do-create-link').click();
    });

    let deepInviteLink: string;

    await test.step('User A modifies the link to a deep link', async () => {
      const inviteLink = await userAPage.getByTestId('status-invite-link').textContent();
      if (inviteLink) {
        deepInviteLink = inviteLink.replace(/^https:\/\/[^/]+\//, 'wire://');
      }
    });

    await test.step('User B opens the invitation deep link outside of the application', async () => {
      if (deepInviteLink) {
        await open(deepInviteLink);
        const joinConversationButton = app.page.getByRole('button', {name: 'Join conversation'});
        await expect(joinConversationButton).toBeVisible();
      }
    });
  },
);

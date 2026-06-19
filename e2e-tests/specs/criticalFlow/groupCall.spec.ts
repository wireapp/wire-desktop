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

import {loginUser} from './../../actions/loginUser';
import {callingPage} from './../../poms/webapp/calling.page';
import {conversationPage} from './../../poms/webapp/conversation.page';

import {createGroup} from '../../actions/createGroup';
import {test, expect} from '../../fixtures';
import {conversationsList} from '../../poms/webapp/conversationList.page';

test(
  'I want to have a group call',
  {tag: ['@TC-11071', '@crit-flow-web']},
  async ({page, createUser, createTeam, createPage}) => {
    const [member, memberPage] = await Promise.all([createUser(), createPage()]);
    const team = await createTeam('Calling', {users: [member], features: {conferenceCalling: true}});
    const owner = team.owner;
    const conversationName = 'Calling';

    await Promise.all([loginUser(memberPage, member), loginUser(page, owner)]);

    await test.step('Owner creates group and adds the member', async () => {
      await createGroup(page, conversationName, [member]);
    });

    await test.step('Owner starts call', async () => {
      await conversationsList(page).getConversation(conversationName).open();
      await conversationPage(page).startCallButton.click();
      await expect(callingPage(page).callCell).toBeVisible();
    });

    await test.step('Member accepts call', async () => {
      await conversationsList(memberPage).getConversation(conversationName).open();
      await callingPage(memberPage).acceptCallButton.click();

      await expect(callingPage(memberPage).goFullScreen).toBeVisible();
      await expect(callingPage(page).goFullScreen).toBeVisible();
    });
  },
);

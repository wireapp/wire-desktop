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
import {test, expect} from '../../fixtures';
import {callCell} from '../../poms/webapp/callCell.page';
import {conversation} from '../../poms/webapp/conversation.page';
import {conversationsList} from '../../poms/webapp/conversationList.page';

test.describe('Calling - Feature Functionality', () => {
  test(
    'Verify call window maximization in 1:1 and the group call',
    {tag: ['@TC-11291', '@regression']},
    async ({app, createUser, createTeam, createPage}) => {
      const userB = await createUser();
      const {owner: userA} = await createTeam('Test Team', {
        users: [userB],
        features: {conferenceCalling: true},
      });
      const userAPage = app.page;
      const userBPage = await createPage();

      await Promise.all([loginUser(userAPage, userA), loginUser(userBPage, userB)]);
      await connectWithUser(userAPage, userB);

      for (const callType of ['1:1', 'Group']) {
        if (callType === 'Group') {
          await createGroup(userAPage, 'Calling Group', [userB]);
          await conversationsList(userAPage).getConversation('Calling Group').open();
        } else {
          await conversationsList(userAPage).getConversation(userB.fullName, {protocol: 'mls'}).open();
        }

        await test.step(`User A initiates a ${callType} call with user B`, async () => {
          await conversation(userAPage).startCallButton.click();
          await expect(callCell(userAPage)).toBeVisible();

          await expect(callCell(userBPage)).toBeVisible();
          await callCell(userBPage).acceptCallButton.click();
        });

        await test.step('User A can maximized the call with user B', async () => {
          const newWindowPromise = app.waitForEvent('window');
          await callCell(userAPage).openInNewWindow.click();
          const fullscreenWindow = await newWindowPromise;

          await expect(fullscreenWindow.getByRole('switch', {name: 'Camera'})).toBeVisible();
          await fullscreenWindow.getByRole('button', {name: 'Hang up'}).click();
          if (callType === '1:1') {
            await expect(callCell(userBPage)).not.toBeVisible();
          }
        });
      }
    },
  );
});

test.describe('Calling - Negative Scenarios / Permissions', () => {
  test.use({
    appOptions: async ({appOptions}, use) => {
      await use({
        ...appOptions,
        bypassPermissions: false,
      });
    },
  });

  test(
    'Verify call establishment fails without required permissions',
    {tag: ['@TC-11297', '@regression']},
    async ({app, createUser, createTeam, createPage}) => {
      await app.evaluate(({session}) => {
        session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
          if (permission === 'media') {
            return callback(false);
          }
          callback(true);
        });
      });
      const userB = await createUser();
      const {owner: userA} = await createTeam('Test Team', {
        users: [userB],
      });
      const userAPage = app.page;
      const userBPage = await createPage();

      await Promise.all([loginUser(userAPage, userA), loginUser(userBPage, userB)]);
      await connectWithUser(userAPage, userB);

      await conversationsList(userAPage).getConversation(userB.fullName, {protocol: 'mls'}).open();
      await conversation(userAPage).startCallButton.click();

      await expect(app.page.getByText('No camera access')).toBeVisible();
    },
  );
});

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

import {Page} from '@playwright/test';

import {connectWithUser} from '../../actions/connectWithUser';
import {createGroup} from '../../actions/createGroup';
import {loginUser} from '../../actions/loginUser';
import {openDeepLink} from '../../actions/openDeepLink';
import {sendConnectionRequest} from '../../actions/sendConnectionRequest';
import {expect, test} from '../../fixtures';
import {accountsSidebar} from '../../poms/app/accountsSidebar.page';
import {connectionRequestPage} from '../../poms/webapp/connectionRequest.page';
import {conversation} from '../../poms/webapp/conversation.page';
import {conversationsList} from '../../poms/webapp/conversationList.page';
import {ssoPage} from '../../poms/webapp/sso.page';

/* The heading and the hint are two separate text fields, the input below accepts an email or an SSO code */
const expectLoginPageVisible = async (page: Page) => {
  await expect(page.getByText('Welcome to Wire!')).toBeVisible();
  await expect(page.getByText('Please enter your email or SSO code.')).toBeVisible();
  await expect(ssoPage(page).codeEmailInput).toBeVisible();
};

test.describe('Deep Links', async () => {
  // OS level deep links need the packaged app registered as handler, all other specs run from the sources
  test.use({appOptions: {env: process.env.WEBAPP_URL, lang: 'en', executablePath: process.env.WIRE_APP_PATH}});

  test('Open a profile via deep link', {tag: ['@TC-11273', '@regression']}, async ({app, createUser, createPage}) => {
    const userA = await createUser();
    const userB = await createUser();
    const pageB = await createPage();

    await test.step('UserA logs in', async () => {
      await loginUser(app.page, userA);
    });

    await test.step('UserA sends a connection request to UserB', async () => {
      await sendConnectionRequest(app.page, userB);
    });

    await test.step('UserB logs in on a web page and approves the connection request', async () => {
      // Logging in after the request was sent makes the web app open it directly
      await loginUser(pageB, userB);
      await connectionRequestPage(pageB).connectButton.click();
      await expect(conversation(pageB).conversationTitle).toContainText(userA.fullName);
    });

    await test.step('UserA opens the deep link for the profile of UserB', async () => {
      await openDeepLink(app, `wire://user/${userB.id}`);
    });

    await test.step('Profile pop-up with the handle of UserB and an "Open conversation" button appears', async () => {
      // The handle is also shown in the conversation list and the conversation, so scope the lookup to the pop-up
      const profileModal = app.page.getByTestId('modal-user-profile');
      await expect(profileModal.getByText(`@${userB.username}`)).toBeVisible();
      await expect(profileModal.getByRole('button', {name: 'Open conversation'})).toBeVisible();
    });
  });

  test(
    'Open a conversation via deep link',
    {tag: ['@TC-11274', '@regression']},
    async ({app, createUser, createTeam}) => {
      const userA = await createUser();
      const userB = await createUser();
      const userC = await createUser();
      await createTeam('Deep Links', {users: [{user: userA, role: 'owner'}, userB, userC]});

      const messageToB = 'Conversation with User B';
      const messageToC = 'Conversation with User C';
      let conversationIdWithB = '';

      await test.step('UserA logs in', async () => {
        await loginUser(app.page, userA);
      });

      await test.step('UserA sends a message to UserB and remembers the conversation', async () => {
        await connectWithUser(app.page, userB);
        await conversation(app.page).sendMessage(messageToB);
        await expect(conversation(app.page).getMessage({content: messageToB})).toBeVisible();

        // The hash looks like "#/conversation/<id>/<domain>"
        conversationIdWithB = await app.page.evaluate(() => window.location.hash.split('/')[2]);
        expect(conversationIdWithB).toBeTruthy();
      });

      await test.step('UserA sends a message to UserC and keeps that conversation open', async () => {
        await connectWithUser(app.page, userC);
        // Make sure that the conversation with UserC is opened before sending the message
        await expect(conversation(app.page).conversationTitle).toContainText(userC.fullName);
        await conversation(app.page).sendMessage(messageToC);
        await expect(conversation(app.page).getMessage({content: messageToC})).toBeVisible();
      });

      await test.step('UserA opens the deep link for the conversation with UserB', async () => {
        await openDeepLink(app, `wire://conversation/${conversationIdWithB}`);
      });

      await test.step('The conversation with UserB opens and contains its message', async () => {
        await expect(conversation(app.page).getMessage({content: messageToB})).toBeVisible();
        await expect(conversation(app.page).getMessage({content: messageToC})).toBeHidden();
      });
    },
  );

  test(
    'Join a group conversation via deep link',
    {tag: ['@TC-11276', '@regression']},
    async ({app, createUser, createTeam, createPage}) => {
      const userA = await createUser();
      const userB = await createUser();
      await createTeam('Deep Links', {users: [{user: userA, role: 'owner'}, userB]});
      const groupName = 'Deep link group';

      const pageA = await createPage();
      let deepLink = '';

      await test.step('UserB logs in in the application', async () => {
        await loginUser(app.page, userB);
      });

      await test.step('UserA logs in on a web page', async () => {
        await loginUser(pageA, userA);
      });

      await test.step('UserA creates a group with no members and generates an invite link', async () => {
        await createGroup(pageA, groupName, []);
        await conversationsList(pageA).getConversation(groupName).open();
        await pageA.getByRole('button', {name: 'Invite'}).click();
        await pageA.getByText('Not password secured').click();
        await pageA.getByRole('button', {name: 'Create link'}).click();

        const link = await pageA
          .getByText(/conversation-join\/\?key=/)
          .first()
          .innerText();
        deepLink = link.trim().replace(/^https:\/\/[^/]+\/conversation-join\//, 'wire://conversation-join/');
        expect(deepLink).toMatch(/^wire:\/\/conversation-join\/\?key=.+&code=.+&domain=.+/);
      });

      await test.step('UserB opens the invitation deep link', async () => {
        await openDeepLink(app, deepLink);
      });

      await test.step('The pop-up with the "Join conversation" button appears', async () => {
        await expect(app.page.getByRole('button', {name: 'Join conversation'})).toBeVisible();
      });
    },
  );

  test(
    'Open a login page via deep link with 0 accounts logged in',
    {tag: ['@TC-11275', '@regression']},
    async ({app}) => {
      await test.step('User opens the start-login deep link', async () => {
        await openDeepLink(app, 'wire://start-login/');
      });

      await test.step('The login page opens and no accounts sidebar is visible', async () => {
        await expectLoginPageVisible(app.page);
        await expect(accountsSidebar(app).accountItems).toHaveCount(0);
      });
    },
  );

  test(
    'Open a login page via deep link with 1 account logged in',
    {tag: ['@TC-11292', '@regression']},
    async ({app, createUser}) => {
      const userA = await createUser();

      await test.step('UserA logs in', async () => {
        await loginUser(app.page, userA);
      });

      await test.step('User opens the start-login deep link', async () => {
        const newWindowPromise = app.waitForEvent('window');
        await openDeepLink(app, 'wire://start-login/');
        app.page = await newWindowPromise;
      });

      await test.step('The login page opens and the accounts sidebar is visible', async () => {
        await expectLoginPageVisible(app.page);
        await expect(accountsSidebar(app).getAccount(userA)).toBeVisible();
      });
    },
  );

  test('Open an SSO login page via deep link', {tag: ['@TC-11281', '@regression']}, async ({app}) => {
    const ssoCode = process.env.KEYCLOAK_USER_SSO_CODE;
    if (ssoCode === undefined) {
      throw new Error('Missing env var KEYCLOAK_USER_SSO_CODE');
    }

    await test.step('User opens the start-sso deep link', async () => {
      await openDeepLink(app, `wire://start-sso/${ssoCode}`);
    });

    await test.step('The login page opens with the SSO code filled in', async () => {
      await expectLoginPageVisible(app.page);
      await expect(ssoPage(app.page).codeEmailInput).toHaveValue(ssoCode);
    });
  });

  test(
    'Open a broken deep link to the conversation',
    {tag: ['@TC-11277', '@regression']},
    async ({app, createUser}) => {
      const userA = await createUser();

      await test.step('UserA logs in', async () => {
        await loginUser(app.page, userA);
      });

      await test.step('UserA opens a broken conversation deep link', async () => {
        await openDeepLink(app, 'wire://conversation/broken-uuid-0');
      });

      await test.step('A pop-up states the conversation can’t be opened', async () => {
        await expect(app.page.getByText('Wire can’t open this conversation.')).toBeVisible();
      });
    },
  );

  test('Open a broken deep link to the user', {tag: ['@TC-11278', '@regression']}, async ({app, createUser}) => {
    const userA = await createUser();

    await test.step('UserA logs in', async () => {
      await loginUser(app.page, userA);
    });

    await test.step('UserA opens a deep link to a user that does not exist', async () => {
      // The webapp only treats the first path segment as a user id if it's a valid UUID (see showUserProfile in appMain.tsx).
      // Anything else, e.g. "broken-uuid-0", is read as a domain without a user id and silently redirects to the start page.
      await openDeepLink(app, 'wire://user/00000000-0000-4000-8000-000000000000');
    });

    await test.step('A pop-up states the person can’t be found', async () => {
      await expect(app.page.getByText('Wire can’t find this person.')).toBeVisible();
    });
  });

  test(
    'Open a broken deep link to join the group conversation',
    {tag: ['@TC-11279', '@regression']},
    async ({app, createUser}) => {
      const userA = await createUser();

      await test.step('UserA logs in', async () => {
        await loginUser(app.page, userA);
      });

      await test.step('UserA opens a broken conversation-join deep link', async () => {
        await openDeepLink(app, 'wire://conversation-join/?key=KzuT8f_qse2JLncsF95-&code=broken-uuid-0');
      });

      await test.step('A pop-up states the conversation could not be joined', async () => {
        await expect(app.page.getByText('You could not join the conversation')).toBeVisible();
        await expect(app.page.getByText('The conversation link is invalid.')).toBeVisible();
      });
    },
  );
});

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

import {User} from './createUser';

import {InbucketClientE2E} from '../backend/InbucketApiClient';
import {conversationsSidebar} from '../poms/webapp/conversationsSidebar.page';
import {emailVerificationPage} from '../poms/webapp/emailVerification.page';
import {LOGIN_TIMEOUT, loginPage} from '../poms/webapp/login.page';
import {ssoPage} from '../poms/webapp/sso.page';

const inbucketClient = () => {
  if (process.env.INBUCKET_URL === undefined) {
    throw new Error('Missing env var INBUCKET_URL');
  }

  if (process.env.INBUCKET_USERNAME === undefined) {
    throw new Error('Missing env var INBUCKET_USERNAME');
  }

  if (process.env.INBUCKET_PASSWORD === undefined) {
    throw new Error('Missing env var INBUCKET_PASSWORD');
  }

  return new InbucketClientE2E();
};

const fillLoginCredentials = async (page: Page, user: User) => {
  await ssoPage(page).codeEmailInput.fill(user.email);
  await ssoPage(page).loginButton.click();

  await loginPage(page).passwordInput.fill(user.password);
  await loginPage(page).loginButton.click();
};

const fillIn2FAPage = async (page: Page, user: User) => {
  const code = await inbucketClient().getVerificationCode(user.email);
  await emailVerificationPage(page).enterVerificationCode(code);
};

/* Visit the sso page and execute the login for the user */
export const loginUser = async (page: Page, user: User) => {
  await fillLoginCredentials(page, user);
  await fillIn2FAPage(page, user);
  await conversationsSidebar(page).userAvatar.waitFor({state: 'visible', timeout: LOGIN_TIMEOUT});
};

export const loginUserAfterDataCleanup = async (page: Page, user: User) => {
  await fillLoginCredentials(page, user);
  const historyConfirmButton = loginPage(page).historyConfirmButton;
  await historyConfirmButton.click();

  await conversationsSidebar(page).userAvatar.waitFor({state: 'visible', timeout: LOGIN_TIMEOUT});
};

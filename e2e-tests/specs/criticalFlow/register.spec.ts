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

import {createUser} from '../../actions/createUser';
import {expect, test} from '../../fixtures';
import {accountsSidebar} from '../../poms/app/accountsSidebar.page';
import {conversationsSidebar} from '../../poms/webapp/conversationsSidebar.page';
import {emailVerificationPage} from '../../poms/webapp/emailVerification.page';
import {LOGIN_TIMEOUT, loginPage} from '../../poms/webapp/login.page';
import {registrationPage} from '../../poms/webapp/registration.page';
import {setAccountTypePage} from '../../poms/webapp/setAccountType.page';
import {setHandlePage} from '../../poms/webapp/setHandle.page';
import {ssoPage} from '../../poms/webapp/sso.page';

test(
  'I want to register a new Wire account',
  {tag: ['@TC-10924', '@crit-flow-desktop']},
  async ({app, page, brigApi}) => {
    const user = createUser();

    await test.step('User initiates the registration from the log in page', async () => {
      await ssoPage(page).codeEmailInput.fill(user.email);
      await ssoPage(page).loginButton.click();
      await expect(loginPage(page).createAccountButton).toBeVisible();

      await loginPage(page).createAccountButton.click();

      await setAccountTypePage(page).createPersonalAccountButton.click();
    });

    await test.step('User completes the signup', async () => {
      const {nameInput, emailInput, passwordInput, confirmPasswordInput, termsAndConditionsCheckbox, submitButton} =
        registrationPage(page);

      await nameInput.fill(user.fullName);
      await emailInput.fill(user.email);
      await passwordInput.fill(user.password);
      await confirmPasswordInput.fill(user.password);
      await termsAndConditionsCheckbox.check({force: true});

      await submitButton.click();
    });

    await test.step('User enters activation code from email', async () => {
      const {verificationCodeInput, enterVerificationCode} = emailVerificationPage(page);
      await expect(verificationCodeInput).toBeVisible();

      const verificationCode = await brigApi.getUserActivationCode(user.email);
      await enterVerificationCode(verificationCode);
    });

    await test.step('User does not want to receive news and updates via email', async () => {
      const modal = page.getByRole('dialog');
      await expect(modal).toContainText('Do you want to receive news and product updates from Wire via email?');
      await modal.getByRole('button', {name: 'No, thanks'}).click();
    });

    await test.step('User checks the automatically generated username', async () => {
      const {pageTitle, handleInput, continueButton} = setHandlePage(page);
      await expect(pageTitle).toBeVisible();
      await expect(handleInput).not.toHaveValue('');
      await continueButton.click();
    });

    await test.step('User declines sending usage data', async () => {
      const modal = page.getByRole('dialog');
      await expect(modal).toContainText('Consent to share user data', {timeout: LOGIN_TIMEOUT});
      await modal.getByRole('button', {name: 'Decline'}).click();
    });

    await test.step("User verifies he's now logged in with his new account", async () => {
      await expect(conversationsSidebar(page).userAvatar).toContainText(user.initials);
      await expect(accountsSidebar(app).getAccount(user)).toBeVisible();
    });
  },
);

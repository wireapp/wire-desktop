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

import {loginUser} from '../../actions/loginUser';
import {expect, test} from '../../fixtures';
import {menuBar} from '../../poms/app/menuBar.page';
import {ssoPage} from '../../poms/webapp/sso.page';

test.describe('Localization', () => {
  test('I want to verify initial language is EN', {tag: ['@TC-11283', '@regression']}, async ({app, createUser}) => {
    const user = await createUser();

    await test.step('Go to login screen and verify welcome screen', async () => {
      await expect(ssoPage(app.page).codeEmailInput).toBeVisible();
    });

    await test.step('User logs in', async () => {
      await loginUser(app.page, user);
    });

    await test.step('Verify English is selected in the menu bar', async () => {
      const selectedLanguage = await menuBar(app).getCurrentLanguage();
      expect(selectedLanguage).toBe('English');
    });

    await test.step('Verify English "All conversations"', async () => {
      await expect(app.page.getByText('All conversations')).toBeVisible();
    });
  });

  test(
    'I want to switch language to DE',
    {tag: ['@TC-11284', '@regression']},
    async ({os, app: initialApp, createUser}) => {
      let app = initialApp; // The app needs to be re-assigned after reopening it
      const user = await createUser();

      await test.step('Go to login screen and verify welcome screen', async () => {
        await expect(ssoPage(app.page).codeEmailInput).toBeVisible();
      });

      await test.step('User logs in', async () => {
        await loginUser(app.page, user);
        await expect(app.page.getByText('All conversations')).toBeVisible();
      });

      await test.step('Switch language to German via menu bar', async () => {
        // Stub showMessageBox function of electron
        await app.evaluate(({dialog}) => {
          const stubMeta = {calls: [] as unknown[]};
          const stubFunction: typeof dialog.showMessageBox = async (...args: unknown[]) => {
            stubMeta.calls.push(args);
            return {response: 0, checkboxChecked: false}; // Response 0 means button at index one which ignores the reboot as we have to do it manually
          };

          // We overload the stub function to add the __mock property to it. This way we can check the arguments it was called with in the next test step
          dialog.showMessageBox = Object.assign(stubFunction, {__mock: stubMeta});
        });

        await menuBar(app).switchLanguage('Deutsch');
      });

      await test.step('Verify restart popup is shown', async () => {
        // Get metadata from stub
        const showMessageBox = await app.evaluate(
          ({dialog}) => (dialog.showMessageBox as unknown as {__mock: {calls: unknown[]}}).__mock,
        );

        expect(showMessageBox.calls).toMatchObject([
          [
            {
              type: 'info',
              title: 'Neustart erforderlich',
              message: 'Bitte starten Sie Wire erneut, damit diese Einstellung wirksam wird.',
              buttons: ['Später', expect.stringContaining(os === 'macOS' ? 'beenden' : 'Neu Starten')],
            },
          ],
        ]);
      });

      // We need to manually relaunch the app because by executing the restart from the app itself playwright would loose the reference to it
      app = await test.step('User restarts app', async () => {
        return await app.reopen();
      });

      await test.step('Verify German is selected in the menu bar', async () => {
        const selectedLanguage = await menuBar(app).getCurrentLanguage();
        expect(selectedLanguage).toBe('Deutsch');
      });

      await test.step('Verify German "Alle Unterhaltungen"', async () => {
        await expect(app.page.getByText('Alle Unterhaltungen', {exact: true})).toBeVisible();
      });
    },
  );
});

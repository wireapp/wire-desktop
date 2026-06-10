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

import {test, expect} from '../../fixtures';

test.describe('Keyboard Shortcuts', () => {
  test(
    'Create new group conversation using keyboard shortcuts',
    {tag: ['@TC-10968', '@regression']},
    async ({app, page}) => {
      await expect(page.getByText('Welcome to Wire!').first()).toBeVisible();
      // Using a test account with a pre-created conversation to skip the onboarding flow faster
      const email = '';
      const password = '';

      await page.locator('#sso-code-email').fill(email);
      await page.locator('[data-uie-name="do-sso-sign-in"]').click();
      await page.locator('[data-uie-name="enter-password"]').fill(password);
      await page.locator('[data-uie-name="do-sign-in"]').click();

      await page.locator('[data-uie-name="do-history-confirm"]').click();
      await expect(page.getByText('All conversations')).toBeVisible({timeout: 40000});

      // For keyboard shortcuts registered in the application menu
      await app.evaluate(async ({Menu, BrowserWindow}) => {
        const menu = Menu.getApplicationMenu();

        const target = menu?.items
          .flatMap(item => item.submenu?.items ?? [])
          .find(item => item.accelerator === 'CmdOrCtrl+N');

        if (!target) {
          throw new Error('Menu item not found');
        }

        const targetWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        if (!targetWindow) {
          throw new Error('No Electron window found to send the menu event to');
        }

        target.click(target, targetWindow);
      });

      await expect(page.getByText('Create group')).toBeVisible();
    },
  );

  test(
    'Mute and unmute group and 1:1 conversations with keyboard shortcut',
    {tag: ['@TC-10965', '@regression']},
    async ({app, page}) => {
      await expect(page.getByText('Welcome to Wire!').first()).toBeVisible();
      // Use a test account with a pre-created conversation to skip the onboarding flow faster
      const email = '';
      const password = '';

      await page.locator('#sso-code-email').fill(email);
      await page.locator('[data-uie-name="do-sso-sign-in"]').click();
      await page.locator('[data-uie-name="enter-password"]').fill(password);
      await page.locator('[data-uie-name="do-sign-in"]').click();
      await page.locator('[data-uie-name="do-history-confirm"]').click();

      await expect(page.getByText('All conversations')).toBeVisible({timeout: 40000});
      // For keyboard shortcuts registered as global shortcuts in the main process
      await app.evaluate(async ({BrowserWindow}) => {
        const win = BrowserWindow.getAllWindows()[0];

        win.webContents.send('EVENT_TYPE.UI.SYSTEM_MENU', 'EVENT_TYPE.CONVERSATION.TOGGLE_MUTE');
      });

      // 3. Verification Assertion
      await expect(page.getByText('Notifications')).toBeVisible();
    },
  );
});

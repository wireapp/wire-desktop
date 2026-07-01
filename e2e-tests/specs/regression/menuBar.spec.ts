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

import {createGroup} from '../../actions/createGroup';
import {loginUser} from '../../actions/loginUser';
import {test, expect, Page} from '../../fixtures';
import {settingsPage} from '../../poms/webapp/settings.page';
import {conversation} from '../../poms/webapp/conversation.page';
import {type App} from '../../actions/createApp';
import {conversationsList} from './../../poms/webapp/conversationList.page';
import {MenuItem} from 'electron';
import {loginPage} from '../../poms/webapp/login.page';
import {connectWithUser} from '../../actions/connectWithUser';

/**
 * Triggers an Electron application menu item by matching its label.
 * Supports cross-platform variants by accepting either a single string or an array of strings.
 * * @param {object} app - The Playwright Electron application instance
 * @param {string|string[]} labels - The menu label(s) to match against (e.g., 'Settings' or ['Preferences', 'Settings'])
 * @returns A Promise resolving to the serialized accelerator string of the clicked MenuItem
 */

const triggerApplicationMenu = async (app: App, labels: string[]): Promise<Pick<MenuItem, 'accelerator'>> => {
  // Normalize input to an array so we can consistently use .includes()
  const labelList = Array.isArray(labels) ? labels : [labels];

  return await app.evaluate(async ({Menu, BrowserWindow}, targets) => {
    const menu = Menu.getApplicationMenu();

    const target = menu?.items.flatMap(item => item.submenu?.items ?? []).find(item => targets.includes(item.label));

    if (!target) {
      throw new Error('Menu item not found');
    }

    const targetWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    if (!targetWindow) {
      throw new Error('No Electron window found to send the menu event to');
    }

    // Programmatically trigger the menu item's click action
    target.click(target, targetWindow);
    return {
      accelerator: target.accelerator,
    };
  }, labelList);
};

test.describe('Menu Bar', () => {
  test('Open preferences/settings with menu bar', {tag: ['@TC-11010', '@regression']}, async ({app, createUser}) => {
    const user = await createUser();
    await loginUser(app.page, user);

    // Access the native Electron application menu and click the appropriate item
    const menuItem = await triggerApplicationMenu(app, ['Preferences', 'Settings']);

    expect(menuItem.accelerator).toMatch(/^(Command\+,|Ctrl\+,)$/);
    await expect(settingsPage(app.page).accountButton).toBeVisible();
  });

  test(
    'Verify switching to next and previous conversation using menu bar',
    {tag: ['@TC-11068', '@regression']},
    async ({app, createUser}) => {
      const user = await createUser();
      await loginUser(app.page, user);

      await test.step('Create multiple group conversations', async () => {
        await createGroup(app.page, 'Group 1', []);
        await createGroup(app.page, 'Group 2', []);
        await expect(conversationsList(app.page).items).toHaveCount(2);
      });

      await test.step('Verify navigation to the next conversation and validate its keyboard shortcut', async () => {
        await conversationsList(app.page).getConversation('Group 1').open();
        const menuItem = await triggerApplicationMenu(app, ['Next Conversation']);

        expect(menuItem.accelerator).toMatch(/^(Alt\+(Cmd|Shift)\+Up)$/);
        await expect(conversation(app.page).conversationTitle).toContainText('Group 2');
      });

      await test.step('Navigate to the previous conversation via the application menu', async () => {
        const menuItem = await triggerApplicationMenu(app, ['Previous Conversation']);

        expect(menuItem.accelerator).toMatch(/^(Alt\+(Cmd|Shift)\+Down)$/);
        await expect(conversation(app.page).conversationTitle).toContainText('Group 1');
      });
    },
  );

  test(
    'Verify I can create a group conversation with menu bar',
    {tag: ['@TC-11066', '@regression']},
    async ({app, createUser}) => {
      const user = await createUser();
      await loginUser(app.page, user);

      const menuItem = await triggerApplicationMenu(app, ['Create Group']);

      expect(menuItem.accelerator).toBe('CmdOrCtrl+N');
      await expect(app.page.getByRole('dialog').getByText('Create group')).toBeVisible();
    },
  );

  test('Sign out with menu bar', {tag: ['@TC-11041', '@regression']}, async ({app, createUser}) => {
    const user = await createUser();
    await loginUser(app.page, user);

    await triggerApplicationMenu(app, ['Log Out']);
    await app.page.getByRole('dialog').getByRole('button', {name: 'Log out'}).click();
    await expect(loginPage(app.page).loginButton).toBeVisible();
  });

  const testCases = [
    {
      name: 'Verify opening people popover with menu bar in the conversation',
      tag: '@TC-11045',
      menuItem: 'People',
      verifyDirect: async (page: Page) => {
        await expect(page.getByTestId('status-profile-picture')).toBeVisible();
      },
      verifyGroup: async (page: Page) => {
        await expect(page.getByTestId('list-users')).toBeVisible();
      },
    },
    {
      name: 'Delete conversation content with menu bar',
      tag: '@TC-11042',
      menuItem: 'Delete Content...',
      verifyDirect: async (page: Page) => {
        await expect(page.getByRole('dialog').getByText('Clear content?')).toBeVisible();
        await page.getByRole('dialog').getByRole('button', {name: 'Cancel'}).click();
      },
      verifyGroup: async (page: Page) => {
        await expect(page.getByRole('dialog').getByText('Clear content?')).toBeVisible();
      },
    },
    {
      name: 'Verify I can ping 1:1 and group conversation using the menu bar',
      tag: '@TC-11043',
      menuItem: 'Ping',
      verifyDirect: async (page: Page) => {
        await expect(conversation(page).systemMessages.filter({hasText: 'You pinged'})).toBeVisible();
      },
      verifyGroup: async (page: Page) => {
        await expect(conversation(page).systemMessages.filter({hasText: 'You pinged'})).toBeVisible();
      },
    },
  ];

  testCases.forEach(({name, tag, menuItem, verifyDirect, verifyGroup}) => {
    test(name, {tag: [tag, '@regression']}, async ({app, createUser, createTeam, createPage}) => {
      const userB = await createUser();
      const {owner: userA} = await createTeam('Test Team', {users: [userB]});
      const userAPage = app.page;
      const userBPage = await createPage();

      await Promise.all([loginUser(userAPage, userA), loginUser(userBPage, userB)]);
      await connectWithUser(userAPage, userB);

      await test.step('User A actions in 1:1 conversation', async () => {
        await conversationsList(userAPage).getConversation(userB.fullName).open();
        await triggerApplicationMenu(app, [menuItem]);
        await verifyDirect(app.page);
      });

      await test.step('User A actions in group conversation', async () => {
        await createGroup(app.page, 'Test group', [userB]);
        await conversationsList(userAPage).getConversation('Test group').open();
        await triggerApplicationMenu(app, [menuItem]);
        await verifyGroup(app.page);
      });
    });
  });
});

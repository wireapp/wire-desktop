import {conversationsList} from './../../poms/webapp/conversationList.page';
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
import {test, expect} from '../../fixtures';
import {settingsPage} from '../../poms/webapp/settings.page';
import {conversation} from '../../poms/webapp/conversation.page';

test.describe('Menu Bar', () => {
  test('Open preferences/settings with menu bar', {tag: ['@TC-11010', '@regression']}, async ({app, createUser}) => {
    const user = await createUser();
    await loginUser(app.page, user);

    // Access the native Electron application menu and click the appropriate item
    const menuItem = await app.evaluate(async ({Menu, BrowserWindow}) => {
      const menu = Menu.getApplicationMenu();
      const target = menu?.items
        .flatMap(item => item.submenu?.items ?? [])
        .find(item => item.label === 'Preferences' || item.label === 'Settings');

      if (!target) {
        throw new Error('Menu item not found');
      }

      const targetWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (!targetWindow) {
        throw new Error('No Electron window found to send the menu event to');
      }

      // Trigger the click handler associated with the menu item
      target.click(target, targetWindow);
      return target;
    });

    expect(menuItem.accelerator).toMatch(/^(Command\+,|Ctrl\+,)$/);
    await expect(settingsPage(app.page).accountButton).toBeVisible();
  });
});

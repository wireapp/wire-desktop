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

import {MenuItem} from 'electron';

import {type App} from '../../actions/createApp';
import {loginUser} from '../../actions/loginUser';
import {expect, test} from '../../fixtures';
import {ssoPage} from '../../poms/webapp/sso.page';

type MenuItemSnapshot = {
  label: string;
  checked?: boolean;
  enabled?: boolean;
  type?: string;
  submenu?: MenuItemSnapshot[];
};

const normalizeMenuLabel = (label?: string) => (label ?? '').replace(/&/g, '');

const getApplicationMenu = async (app: App): Promise<MenuItemSnapshot[]> =>
  app.evaluate(({Menu}) => {
    const serialize = (item: MenuItem): MenuItemSnapshot => ({
      label: item.label,
      checked: item.checked,
      enabled: item.enabled,
      type: item.type,
      submenu: item.submenu?.items.map(serialize),
    });

    return Menu.getApplicationMenu()?.items.map(serialize) ?? [];
  });

const findMenuItem = (
  items: MenuItemSnapshot[],
  predicate: (item: MenuItemSnapshot) => boolean,
): MenuItemSnapshot | undefined => {
  for (const item of items) {
    if (predicate(item)) {
      return item;
    }

    if (item.submenu) {
      const nestedItem = findMenuItem(item.submenu, predicate);
      if (nestedItem) {
        return nestedItem;
      }
    }
  }

  return undefined;
};

const expectSelectedMenuLanguage = async (app: App, expectedLanguageLabel: 'English' | 'Deutsch') => {
  const menu = await getApplicationMenu(app);

  const languageItem = findMenuItem(menu, item => normalizeMenuLabel(item.label) === expectedLanguageLabel);

  expect(languageItem, `Expected language "${expectedLanguageLabel}" to exist in the menu`).toBeTruthy();
  expect(languageItem?.checked, `Expected language "${expectedLanguageLabel}" to be selected`).toBe(true);
};

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
      await expectSelectedMenuLanguage(app, 'English');
    });

    await test.step('Verify English "All conversations"', async () => {
      await expect(app.page.getByText('All conversations')).toBeVisible();
    });
  });
});

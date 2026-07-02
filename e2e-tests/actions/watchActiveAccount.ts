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

import {App} from '../types';

// eslint-disable-next-line valid-jsdoc
/**
 * Action to observe the list of accounts inside the apps sidebar.
 * If the currently active one changes the `onChange` callback will be triggered, receiving the new active page.
 * This is required in cases where the account switch isn't initiated by us but through some external event (e.g. clicking a notification or opening a deep link).
 * Also make sure to assert on the new account already being active before continuing to ensure the callback already finished.
 *
 * @example
 * await watchActiveAccount(app, newActivePage => (app.page = newActivePage));
 * await clickNotification({body: 'Test Message'});
 * await expect(accountsSidebar(app).getAccount(userA2).activeBorder).toBeVisible();
 */
export const watchActiveAccount = async (app: App, onChange: (newPage: Page) => void) => {
  /* Make a callback function available on the wrappers window object so it can notify the paywright process */
  const onActiveAccountChange = (newAccountId: string) => {
    const newActivePage = app.windows().find(page => {
      // Compare the id of the window to the one which became active (removing the hash based routing)
      return newAccountId === new URLSearchParams(page.url().split('#')[0]).get('id');
    });

    // If there's a new active account, update the page property of app with its page
    if (newActivePage !== undefined && newActivePage !== app.page) {
      onChange(newActivePage);
    }
  };
  await app.wrapper.exposeFunction('onActiveAccountChange', onActiveAccountChange);

  /* Observe the list of webviews for changes, if the currently visible webview changes inform the playwright process about the new accountId */
  await app.wrapper.locator('ul.WebviewList').evaluate(list => {
    new window.MutationObserver(() => {
      const activeAccountId = list.querySelector('webview[visible="true"]')?.getAttribute('data-accountid');
      if (activeAccountId != undefined) {
        onActiveAccountChange(activeAccountId);
      }
    }).observe(list, {attributeFilter: ['visible'], childList: true, subtree: true});
  });
};

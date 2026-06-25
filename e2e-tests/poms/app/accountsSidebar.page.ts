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

import {App} from '../../actions/createApp';
import {User} from '../../actions/createUser';

export const accountsSidebar = (app: App) => {
  const sidebar = app.wrapper.getByRole('navigation', {name: 'Accounts Sidebar'});

  const accountItems = sidebar.getByTestId('account-cell');
  const addAccountButton = sidebar.getByTestId('do-open-plus-menu');

  /* Trigger the flow to add a new account, replacing the currenly shown page with the page for adding the new account */
  const addAccount = async () => {
    await sidebar.hover();

    const newWindowPromise = app.waitForEvent('window');
    await addAccountButton.click();

    // Set the current page to the now visible one
    app.page = await newWindowPromise;
  };

  /* Switch to the account at the given index, replacing the currently shown page with the page of the other account */
  const switchAccount = async (index: number) => {
    await accountItems.nth(index).click();

    // Set the current page to the new active one. The first index in the windows list is always the wrapper
    app.page = app.windows()[index + 1];
  };

  const removeAccount = async (index: number) => {
    const newWindowPromise = app.waitForEvent('window');
    await accountItems.nth(index).click({button: 'right'});
    await sidebar.getByRole('button', {name: 'Remove Account'}).click();
    app.page = await newWindowPromise;
  };

  return Object.assign(sidebar, {
    accountItems,
    addAccountButton,
    getAccount: (user: User) => {
      const accountLocator = sidebar.getByRole('button', {name: user.fullName});

      return Object.assign(accountLocator, {
        notificationDot: accountLocator.getByText('New message or missed call'),
      });
    },
    addAccount,
    switchAccount,
    removeAccount,
  });
};

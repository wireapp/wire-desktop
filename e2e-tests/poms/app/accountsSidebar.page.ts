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
  return Object.assign(sidebar, {
    getAccount: (user: User) => sidebar.getByRole('button', {name: user.fullName}),
    addAccountButton: sidebar.getByTestId('do-open-plus-menu'),
    accountItems: sidebar.getByTestId('account-cell'),
  });
};

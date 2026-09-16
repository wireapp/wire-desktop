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

export const groupCreationModal = (page: Page) => {
  const modal = page.getByRole('dialog');

  const setGroupName = async (name: string) => {
    await modal.getByRole('textbox', {name: 'Group name'}).fill(name);
    await modal.getByRole('button', {name: 'Next'}).click();
  };

  const selectGroupMembers = async (...usernames: string[]) => {
    for (const username of usernames) {
      await modal.getByLabel('Search by name').fill(username);
      await modal.getByRole('list').getByRole('listitem').filter({hasText: username}).click();
    }
  };

  const doneButton = modal.getByRole('button', {name: 'Done'});
  const skipButton = modal.getByRole('button', {name: 'Skip'});

  return Object.assign(modal, {
    setGroupName,
    selectGroupMembers,
    doneButton,
    skipButton,
  });
};

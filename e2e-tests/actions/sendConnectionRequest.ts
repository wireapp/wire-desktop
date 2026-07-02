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

import {conversationsSidebar, startUI} from '../poms/webapp';
import {User} from '../types';

export async function sendConnectionRequest(page: Page, receiver: User) {
  await conversationsSidebar(page).connectButton.click();

  await startUI(page).searchInput.fill(receiver.username);
  await startUI(page).searchResults.filter({hasText: receiver.username}).click();

  await page.getByRole('dialog').getByRole('button', {name: 'Connect'}).click();
}

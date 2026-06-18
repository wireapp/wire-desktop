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

import {conversationsSidebar} from './../poms/webapp/conversationsSidebar.page';
import {User} from './createUser';

import {Page} from '../fixtures';
import {conversationsList} from '../poms/webapp/conversationList.page';
import {groupCreationPage} from '../poms/webapp/groupCreation.page';
import {startUIPage} from '../poms/webapp/startUI.page';
import {userProfileModal} from '../poms/webapp/userProfile.modal';

export const createGroup = async (page: Page, conversationName: string, users: User[]) => {
  await conversationsList(page).clickCreateGroup();
  await groupCreationPage(page).setGroupName(conversationName);
  await groupCreationPage(page).selectGroupMembers(...users.map(user => user.username));
  await groupCreationPage(page).clickCreateGroupButton();
};

export async function sendConnectionRequest(sender: Page, receiver: User) {
  await conversationsSidebar(sender).clickConnectButton();

  await startUIPage(sender).searchInput.fill(receiver.username);
  await startUIPage(sender).searchResults.filter({hasText: receiver.username}).click();
  await userProfileModal(sender).connectButton.click();
}

export async function connectWithUser(sender: Page, receiver: User) {
  await conversationsSidebar(sender).clickConnectButton();

  await startUIPage(sender).searchInput.fill(receiver.username);
  await startUIPage(sender).searchResults.filter({hasText: receiver.username}).click();
  await userProfileModal(sender).startConversationButton.click();
}

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

export const conversationsList = (page: Page) => {
  const getConversation = (conversationName: string, options?: {protocol?: 'mls' | 'proteus'}) => {
    let conversation = page.getByTestId('item-conversation').filter({hasText: conversationName});

    if (options?.protocol) {
      conversation = conversation.and(page.locator(`[data-protocol="${options.protocol}"]`));
    }
    const enhancedLocator = Object.assign(conversation, {
      // This is just syntactic sugar to allow capturing the enhanced locator from the open function
      open: async () => {
        await conversation.click();
        return enhancedLocator;
      },
    });
    return enhancedLocator;
  };

  const createGroupButton = page.getByTestId('conversation-list-header').getByTestId('go-create-group');

  return {
    getConversation,
    createGroupButton,
  };
};

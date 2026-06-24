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

import {User} from '../../actions/createUser';

export const conversation = (page: Page) => {
  const startCallButton = page.getByTestId('do-call');

  /**
   * The attribute 'send-status' will be 1 while the message is being sent, since we only want to assert on sent messages these messages will be excluded. See: {@see StatusTypes}
   * Status type -1 ensures that system messages do NOT count as sent messages
   */
  const messages = page.locator(
    `[data-uie-name="item-message"]:not([data-uie-send-status="1"]):not([data-uie-send-status="-1"]):not(.system-message)`,
  );

  const messageInput = page.getByTestId('input-message');
  const sendMessageButton = page.getByRole('button', {name: 'Send message'});

  /* Send a message into the currently open conversation */
  const sendMessage = async (message: string) => {
    await messageInput.fill(message);
    await sendMessageButton.click();
  };

  // eslint-disable-next-line valid-jsdoc
  /**
   * Util to get a message in the conversation
   * @returns a Locator to the matching message(s)
   */
  const getMessage = (options?: {content?: string | RegExp; sender?: User}) => {
    let message = messages;

    if (options?.content) {
      message = message.filter({hasText: options.content});
    }

    if (options?.sender?.fullName) {
      message = message.filter({
        // Using getByLabel doesn't work here as the aria label is just placed on a div with no input inside which could be located
        has: page.locator(`.content-message-wrapper[aria-label*="${options.sender.fullName}"]`),
      });
    }

    return message;
  };

  return {
    startCallButton,
    sendMessage,
    getMessage,
  };
};

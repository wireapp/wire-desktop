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

export type WebViewConsoleMessageDetails = Pick<Electron.WebContentsConsoleMessageEventParams, 'message'>;

export type WebViewConsoleLogParameters = {
  getAccountId(): string | undefined;
  getLogFilePath(accountId: string): string;
  reportWriteFailure(logFilePath: string, error: unknown): void;
  writeLogMessage(logFilePath: string, message: string): Promise<void>;
};

const COLOR_CODE_PATTERN = /%c(.+?)%c/gm;
const STYLING_PATTERN = /(color:#|font-weight:)[^;]+; /gm;
const ACCESS_TOKEN_PATTERN = /access_token=[^ &]+/gm;

export function sanitizeWebViewConsoleMessage(message: string): string {
  return message.replace(COLOR_CODE_PATTERN, '$1').replace(STYLING_PATTERN, '').replace(ACCESS_TOKEN_PATTERN, '');
}

export function createWebViewConsoleLogger(
  parameters: WebViewConsoleLogParameters,
): (messageDetails: WebViewConsoleMessageDetails) => Promise<void> {
  return async (messageDetails: WebViewConsoleMessageDetails): Promise<void> => {
    const accountId = parameters.getAccountId();
    if (accountId === undefined) {
      return;
    }

    const logFilePath = parameters.getLogFilePath(accountId);
    const sanitizedMessage = sanitizeWebViewConsoleMessage(messageDetails.message);

    try {
      await parameters.writeLogMessage(logFilePath, sanitizedMessage);
    } catch (error) {
      parameters.reportWriteFailure(logFilePath, error);
    }
  };
}

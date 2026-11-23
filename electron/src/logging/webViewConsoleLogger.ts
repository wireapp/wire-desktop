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

import type {Maybe} from 'true-myth';

import type {WriteConsoleLogMessageParameters} from './boundedLogWriter';

export type WebViewConsoleMessageDetails = Pick<Electron.WebContentsConsoleMessageEventParams, 'message'>;

export type WebViewConsoleLogParameters = {
  getAccountId(): Maybe<string>;
  getLogFilePath(accountId: string): string;
  reportWriteFailure(logFilePath: string, error: unknown): void;
  writeLogMessage(parameters: WriteConsoleLogMessageParameters): Promise<void>;
};

const COLOR_CODE_PATTERN = /%c(.+?)%c/gm;
const STYLING_PATTERN = /(color:#|font-weight:)[^;]+; /gm;
const REDACTED = '[REDACTED]';
const WEB_URL_PATTERN = /\b(?:wss?|https?):\/\/[^\s"'<>\\)]+/gi;
const CREDENTIAL_VALUE_PATTERN =
  /\b(access[_-]?token|refresh[_-]?token|asset[_-]?token|sync_marker|marker_token|client_id|token|password)=([^&\s"'\\]*)/gi;
const AUTHORIZATION_PATTERN = /\b(Bearer|Basic)\s+[^\s,;"'\\]+/gi;
const COOKIE_HEADER_PATTERN = /\b((?:set-)?cookie)\s*:\s*[^\r\n"'\\]*/gi;
const CREDENTIAL_FIELD_PATTERN =
  /("(?:authorization|cookie|set-cookie|sessionCookie|password|(?:access|refresh|asset)[_-]?token(?:Prefix)?|token(?:Prefix)?|cookiePrefix)"\s*:\s*)"(?:\\.|[^"\\])*"/gi;
const LEGACY_ASSET_TOKEN_PATTERN = /(Expected token )\\?"[^"\r\n]*\\?"(?= \(redacted\))/g;
const JSON_WEB_TOKEN_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function sanitizeWebUrl(value: string): string {
  try {
    const url = new URL(value);
    const redactedQuery = url.search === '' ? '' : `?${REDACTED}`;
    const redactedFragment = url.hash === '' ? '' : `#${REDACTED}`;
    return `${url.origin}${value === url.origin ? '' : url.pathname}${redactedQuery}${redactedFragment}`;
  } catch {
    return value;
  }
}

export function sanitizeWebViewConsoleMessage(message: string): string {
  return message
    .replace(COLOR_CODE_PATTERN, '$1')
    .replace(STYLING_PATTERN, '')
    .replace(LEGACY_ASSET_TOKEN_PATTERN, '$1[REDACTED]')
    .replace(CREDENTIAL_FIELD_PATTERN, `$1"${REDACTED}"`)
    .replace(WEB_URL_PATTERN, sanitizeWebUrl)
    .replace(CREDENTIAL_VALUE_PATTERN, `$1=${REDACTED}`)
    .replace(AUTHORIZATION_PATTERN, `$1 ${REDACTED}`)
    .replace(COOKIE_HEADER_PATTERN, `$1: ${REDACTED}`)
    .replace(JSON_WEB_TOKEN_PATTERN, REDACTED);
}

export function createWebViewConsoleLogger(
  parameters: WebViewConsoleLogParameters,
): (messageDetails: WebViewConsoleMessageDetails) => Promise<void> {
  return async (messageDetails: WebViewConsoleMessageDetails): Promise<void> => {
    const activeAccountId = parameters.getAccountId();
    if (activeAccountId.isNothing) {
      return;
    }

    const accountId = activeAccountId.value;
    const logFilePath = parameters.getLogFilePath(accountId);
    const sanitizedMessage = sanitizeWebViewConsoleMessage(messageDetails.message);

    try {
      await parameters.writeLogMessage({
        logFilePath,
        message: sanitizedMessage,
        shouldWrite() {
          const currentAccountId = parameters.getAccountId();
          return currentAccountId.isJust && currentAccountId.value === accountId;
        },
      });
    } catch (error) {
      parameters.reportWriteFailure(logFilePath, error);
    }
  };
}

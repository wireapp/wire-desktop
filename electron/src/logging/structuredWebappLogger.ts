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

import {
  isStructuredLogRecord,
  readBoundedLogBatch,
  structuredLogLimits,
  StructuredLogWriteResult,
} from './structuredLogBatch';

import {isAllowedNavigation, NavigationOrigins} from '../runtime/OriginValidator';

type WebViewLogFrame = {
  readonly url: string;
};

type WebViewLogSender = {
  readonly id: number;
  readonly hostWebContents: object | null;
  readonly mainFrame: WebViewLogFrame;
  isDestroyed(): boolean;
};

type WebViewLogEvent = {
  readonly sender: WebViewLogSender;
  readonly senderFrame: WebViewLogFrame | null;
};

type AuthorizedWebView = NavigationOrigins & {
  readonly accountId: string;
  readonly contents: WebViewLogSender;
  readonly structuredLoggingRevoked?: boolean;
};

type StructuredWebappLoggerDependencies = {
  getWebViewContext(senderId: number): AuthorizedWebView | undefined;
  getWrapperWebContents(): object | undefined;
  getCurrentDate(): Date;
  writeBatch(batch: {accountId: string; date: Date; records: readonly string[]}): Promise<void>;
};

export function createStructuredWebappLogger(dependencies: StructuredWebappLoggerDependencies) {
  const pendingWrites = new Map<WebViewLogSender, {accountId: string; completion: Promise<void>}>();
  const accountDeletions = new Map<string, Promise<void>>();

  function getAuthorizedAccount({sender, senderFrame}: WebViewLogEvent): string | undefined {
    const context = dependencies.getWebViewContext(sender.id);
    const wrapper = dependencies.getWrapperWebContents();
    if (
      context === undefined ||
      context.contents !== sender ||
      context.structuredLoggingRevoked === true ||
      wrapper === undefined ||
      sender.hostWebContents !== wrapper ||
      sender.isDestroyed() ||
      senderFrame === null ||
      senderFrame !== sender.mainFrame ||
      isAllowedNavigation(senderFrame.url, context) === false
    ) {
      return undefined;
    }

    return context.accountId;
  }

  async function receive(event: WebViewLogEvent, payload: unknown): Promise<StructuredLogWriteResult> {
    try {
      const accountId = getAuthorizedAccount(event);
      if (accountId === undefined || accountDeletions.has(accountId)) {
        return 'rejected';
      }

      if (pendingWrites.has(event.sender) || pendingWrites.size >= structuredLogLimits.maximumPendingBatches) {
        return 'busy';
      }

      const records = readBoundedLogBatch(payload);
      if (records === undefined || records.every(isStructuredLogRecord) === false) {
        return 'rejected';
      }

      const date = dependencies.getCurrentDate();
      const completion = dependencies.writeBatch({accountId, date, records});
      pendingWrites.set(event.sender, {accountId, completion});

      try {
        await completion;
        return 'written';
      } finally {
        pendingWrites.delete(event.sender);
      }
    } catch {
      return 'failed';
    }
  }

  async function runAccountDeletion(accountId: string, deleteAccount: () => Promise<void>): Promise<void> {
    const existingDeletion = accountDeletions.get(accountId);
    if (existingDeletion !== undefined) {
      return existingDeletion;
    }

    const writesForAccount = [...pendingWrites.values()]
      .filter(write => {
        return write.accountId === accountId;
      })
      .map(write => {
        return write.completion;
      });
    const deletion = Promise.allSettled(writesForAccount).then(deleteAccount);
    accountDeletions.set(accountId, deletion);

    try {
      await deletion;
    } finally {
      accountDeletions.delete(accountId);
    }
  }

  return {receive, runAccountDeletion};
}

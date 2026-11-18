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

import {Maybe} from 'true-myth';

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
  readonly loggingRevoked: boolean;
};

type StructuredWebappLoggerDependencies = {
  getWebViewContext(senderId: number): Maybe<AuthorizedWebView>;
  getWrapperWebContents(): Maybe<object>;
  getCurrentDate(): Date;
  writeBatch(batch: {accountId: string; date: Date; records: readonly string[]}): Promise<void>;
};

export type StructuredWebappLogger = {
  getConsoleLogAccountId(sender: WebViewLogSender): Maybe<string>;
  receive(event: WebViewLogEvent, payload: unknown): Promise<StructuredLogWriteResult>;
  runAccountDeletion(accountId: string, deleteAccount: () => Promise<void>): Promise<void>;
};

export function createStructuredWebappLogger(dependencies: StructuredWebappLoggerDependencies): StructuredWebappLogger {
  const pendingWrites = new Map<WebViewLogSender, {accountId: string; completion: Promise<void>}>();
  const accountDeletions = new Map<string, Promise<void>>();

  function getActiveWebViewContext(sender: WebViewLogSender): Maybe<AuthorizedWebView> {
    const context = dependencies.getWebViewContext(sender.id);
    if (
      context.isNothing ||
      context.value.contents !== sender ||
      context.value.loggingRevoked === true ||
      accountDeletions.has(context.value.accountId)
    ) {
      return Maybe.nothing();
    }

    return context;
  }

  function getAuthorizedAccountId({sender, senderFrame}: WebViewLogEvent): Maybe<string> {
    const context = getActiveWebViewContext(sender);
    const wrapper = dependencies.getWrapperWebContents();
    const frame = Maybe.of(senderFrame);
    if (
      context.isNothing ||
      wrapper.isNothing ||
      sender.hostWebContents !== wrapper.value ||
      sender.isDestroyed() ||
      frame.isNothing ||
      frame.value !== sender.mainFrame ||
      !isAllowedNavigation(frame.value.url, context.value)
    ) {
      return Maybe.nothing();
    }

    return Maybe.just(context.value.accountId);
  }

  async function writeAuthorizedBatch(event: WebViewLogEvent, payload: unknown): Promise<StructuredLogWriteResult> {
    const authorizedAccountId = getAuthorizedAccountId(event);
    if (authorizedAccountId.isNothing) {
      return 'rejected';
    }

    if (pendingWrites.has(event.sender) || pendingWrites.size >= structuredLogLimits.maximumPendingBatches) {
      return 'busy';
    }

    const records = readBoundedLogBatch(payload);
    if (records.isNothing || !records.value.every(isStructuredLogRecord)) {
      return 'rejected';
    }

    const accountId = authorizedAccountId.value;
    const date = dependencies.getCurrentDate();
    const completion = dependencies.writeBatch({accountId, date, records: records.value});
    pendingWrites.set(event.sender, {accountId, completion});

    try {
      await completion;
      return 'written';
    } finally {
      pendingWrites.delete(event.sender);
    }
  }

  return {
    getConsoleLogAccountId(sender) {
      return getActiveWebViewContext(sender).map(context => {
        return context.accountId;
      });
    },
    async receive(event: WebViewLogEvent, payload: unknown): Promise<StructuredLogWriteResult> {
      try {
        return await writeAuthorizedBatch(event, payload);
      } catch {
        return 'failed';
      }
    },
    async runAccountDeletion(accountId: string, deleteAccount: () => Promise<void>): Promise<void> {
      const existingDeletion = Maybe.of(accountDeletions.get(accountId));
      if (existingDeletion.isJust) {
        return existingDeletion.value;
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
    },
  };
}

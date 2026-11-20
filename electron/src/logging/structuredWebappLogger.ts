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
  isPinoConsoleRecord,
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
  shouldCaptureConsoleMessage(event: WebViewLogEvent, message: string): boolean;
  resetConsoleCapture(sender: WebViewLogSender): void;
  receive(event: WebViewLogEvent, payload: unknown): Promise<StructuredLogWriteResult>;
  runAccountDeletion(accountId: string, deleteAccount: () => Promise<void>): Promise<void>;
};

function isCurrentMainFrame(
  event: WebViewLogEvent,
): event is WebViewLogEvent & {readonly senderFrame: WebViewLogFrame} {
  const {sender, senderFrame} = event;
  return senderFrame !== null && !sender.isDestroyed() && senderFrame === sender.mainFrame;
}

export function createStructuredWebappLogger(dependencies: StructuredWebappLoggerDependencies): StructuredWebappLogger {
  const pendingWrites = new Map<WebViewLogSender, {accountId: string; completion: Promise<void>}>();
  const consoleCapture = new Map<WebViewLogSender, {context: AuthorizedWebView; confirmed: boolean}>();
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

  function getAuthorizedContext(event: WebViewLogEvent): Maybe<AuthorizedWebView> {
    if (!isCurrentMainFrame(event)) {
      return Maybe.nothing();
    }

    const {sender, senderFrame} = event;
    const context = getActiveWebViewContext(sender);
    const wrapper = dependencies.getWrapperWebContents();
    if (
      context.isNothing ||
      wrapper.isNothing ||
      sender.hostWebContents !== wrapper.value ||
      !isAllowedNavigation(senderFrame.url, context.value)
    ) {
      return Maybe.nothing();
    }

    return context;
  }

  function resetConsoleCapture(sender: WebViewLogSender): void {
    consoleCapture.delete(sender);
  }

  async function writeAuthorizedBatch(event: WebViewLogEvent, payload: unknown): Promise<StructuredLogWriteResult> {
    const {sender} = event;
    const authorizedContext = getAuthorizedContext(event);
    if (authorizedContext.isNothing) {
      if (isCurrentMainFrame(event)) {
        resetConsoleCapture(sender);
      }
      return 'rejected';
    }
    const context = authorizedContext.value;

    if (pendingWrites.has(sender) || pendingWrites.size >= structuredLogLimits.maximumPendingBatches) {
      resetConsoleCapture(sender);
      return 'busy';
    }

    const records = readBoundedLogBatch(payload);
    if (records.isNothing || !records.value.every(isStructuredLogRecord)) {
      resetConsoleCapture(sender);
      return 'rejected';
    }

    const previousCapture = consoleCapture.get(sender);
    const capture = previousCapture?.context === context ? previousCapture : {context, confirmed: false};
    consoleCapture.set(sender, capture);
    const accountId = context.accountId;
    const date = dependencies.getCurrentDate();

    try {
      const completion = dependencies.writeBatch({accountId, date, records: records.value});
      pendingWrites.set(sender, {accountId, completion});
      await completion;
      if (consoleCapture.get(sender) === capture) {
        const activeContext = getAuthorizedContext(event);
        if (activeContext.isJust && activeContext.value === context) {
          capture.confirmed = true;
        } else {
          resetConsoleCapture(sender);
        }
      }
      return 'written';
    } catch {
      if (consoleCapture.get(sender) === capture) {
        resetConsoleCapture(sender);
      }
      return 'failed';
    } finally {
      pendingWrites.delete(sender);
    }
  }

  return {
    getConsoleLogAccountId(sender) {
      return getActiveWebViewContext(sender).map(context => {
        return context.accountId;
      });
    },
    shouldCaptureConsoleMessage(event, message) {
      if (!isCurrentMainFrame(event)) {
        return true;
      }
      const {sender} = event;
      // The renderer can observe timeouts and missing replies which the main process cannot.
      if (isStructuredTransportWarning(message)) {
        resetConsoleCapture(sender);
        return true;
      }
      const capture = consoleCapture.get(sender);
      if (capture?.confirmed !== true) {
        return true;
      }
      // Confirmation applies to the transport, not to an individual console record.
      // Console events precede the outcome of the batch carrying their records.
      const context = getAuthorizedContext(event);
      if (context.isNothing || capture.context !== context.value) {
        resetConsoleCapture(sender);
        return true;
      }

      return !isPinoConsoleRecord(message);
    },
    resetConsoleCapture,
    async receive(event: WebViewLogEvent, payload: unknown): Promise<StructuredLogWriteResult> {
      try {
        return await writeAuthorizedBatch(event, payload);
      } catch {
        resetConsoleCapture(event.sender);
        return 'failed';
      }
    },
    async runAccountDeletion(accountId: string, deleteAccount: () => Promise<void>): Promise<void> {
      const existingDeletion = Maybe.of(accountDeletions.get(accountId));
      if (existingDeletion.isJust) {
        return existingDeletion.value;
      }

      for (const [sender, capture] of consoleCapture) {
        if (capture.context.accountId === accountId) {
          resetConsoleCapture(sender);
        }
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

function isStructuredTransportWarning(message: string): boolean {
  return (
    /^Desktop structured log write did not receive a successful acknowledgement \((?:rejected|busy|failed|timeout)\)$/.test(
      message,
    ) ||
    message === 'Desktop structured log batch dropped while a previous write is still pending' ||
    message === 'Desktop structured log flush failed'
  );
}

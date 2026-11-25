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

import type {
  RegisteredWebViewContext,
  WebViewIpcAuthorization,
  WebViewIpcEvent,
  WebViewIpcSender,
} from '../runtime/webViewIpcAuthorization';

type StructuredWebappLoggerDependencies = {
  authorization: WebViewIpcAuthorization;
  getCurrentDate(): Date;
  writeBatch(batch: {accountId: string; date: Date; records: readonly string[]}): Promise<void>;
};

export type StructuredWebappLogger = {
  getConsoleLogAccountId(sender: WebViewIpcSender): Maybe<string>;
  shouldCaptureConsoleMessage(event: WebViewIpcEvent, message: string): boolean;
  resetConsoleCapture(sender: WebViewIpcSender): void;
  receive(event: WebViewIpcEvent, payload: unknown): Promise<StructuredLogWriteResult>;
  prepareAccountRemoval(accountId: string): Promise<void>;
};

export function createStructuredWebappLogger(dependencies: StructuredWebappLoggerDependencies): StructuredWebappLogger {
  const pendingWrites = new Map<WebViewIpcSender, {accountId: string; completion: Promise<void>}>();
  const consoleCapture = new Map<WebViewIpcSender, {context: RegisteredWebViewContext; confirmed: boolean}>();

  function resetConsoleCapture(sender: WebViewIpcSender): void {
    consoleCapture.delete(sender);
  }

  async function writeAuthorizedBatch(event: WebViewIpcEvent, payload: unknown): Promise<StructuredLogWriteResult> {
    const {sender} = event;
    const authorizedContext = dependencies.authorization.authorizeWebView(event);
    if (authorizedContext.isNothing) {
      if (dependencies.authorization.isCurrentMainFrame(event)) {
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
        const activeContext = dependencies.authorization.authorizeWebView(event);
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
      return dependencies.authorization.getActiveWebViewContext(sender).map(context => {
        return context.accountId;
      });
    },
    shouldCaptureConsoleMessage(event, message) {
      if (!dependencies.authorization.isCurrentMainFrame(event)) {
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
      const context = dependencies.authorization.authorizeWebView(event);
      if (context.isNothing || capture.context !== context.value) {
        resetConsoleCapture(sender);
        return true;
      }

      return !isPinoConsoleRecord(message);
    },
    resetConsoleCapture,
    async receive(event: WebViewIpcEvent, payload: unknown): Promise<StructuredLogWriteResult> {
      try {
        return await writeAuthorizedBatch(event, payload);
      } catch {
        resetConsoleCapture(event.sender);
        return 'failed';
      }
    },
    async prepareAccountRemoval(accountId: string): Promise<void> {
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
      await Promise.allSettled(writesForAccount);
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

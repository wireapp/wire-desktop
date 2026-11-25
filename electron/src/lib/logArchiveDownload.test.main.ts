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

import noop from 'lodash/noop';
import {Maybe, Result} from 'true-myth';

import * as assert from 'assert';

import type {DesktopLogExportOutcome} from './desktopLogExport';
import {
  createLogArchiveDownloadAction,
  createWebViewLogArchiveDownloadHandler,
  CreateLogArchiveDownloadActionOptions,
  LogArchiveDownloadAction,
} from './logArchiveDownload';

import type {WebViewIpcEvent} from '../runtime/webViewIpcAuthorization';

type TestLogArchiveDownloadOptions = Omit<CreateLogArchiveDownloadActionOptions, 'reportFailure'> &
  Partial<Pick<CreateLogArchiveDownloadActionOptions, 'reportFailure'>>;

function createTestLogArchiveDownloadAction(
  options: TestLogArchiveDownloadOptions,
): ReturnType<typeof createLogArchiveDownloadAction> {
  return createLogArchiveDownloadAction({
    chooseDestinationPath: options.chooseDestinationPath,
    writeArchive: options.writeArchive,
    reportFailure: options.reportFailure ?? noop,
  });
}

describe('log archive download', () => {
  it('returns saved only after the selected archive is written', async () => {
    const steps: string[] = [];
    const downloadArchive = createTestLogArchiveDownloadAction({
      async chooseDestinationPath() {
        steps.push('choose');

        return Result.ok('logs.zip');
      },
      async writeArchive(destinationPath) {
        steps.push(`write:${destinationPath}`);
      },
    });

    const actualOutcome = await downloadArchive();

    assert.strictEqual(actualOutcome, 'saved');
    assert.deepStrictEqual(steps, ['choose', 'write:logs.zip']);
  });

  it('returns cancellation quietly and permits a later archive save', async () => {
    let chooseCount = 0;
    let writeCount = 0;
    let failureReportCount = 0;
    const downloadArchive = createTestLogArchiveDownloadAction({
      async chooseDestinationPath() {
        chooseCount += 1;
        if (chooseCount === 1) {
          return Result.err('cancelled');
        }

        return Result.ok('logs.zip');
      },
      async writeArchive() {
        writeCount += 1;
      },
      reportFailure() {
        failureReportCount += 1;
      },
    });

    const cancelledOutcome = await downloadArchive();

    assert.strictEqual(cancelledOutcome, 'cancelled');
    assert.strictEqual(writeCount, 0);
    assert.strictEqual(failureReportCount, 0);

    const savedOutcome = await downloadArchive();

    assert.strictEqual(savedOutcome, 'saved');
    assert.strictEqual(chooseCount, 2);
    assert.strictEqual(writeCount, 1);
    assert.strictEqual(failureReportCount, 0);
  });

  it('returns a failure when the archive write fails', async () => {
    const downloadArchive = createTestLogArchiveDownloadAction({
      async chooseDestinationPath() {
        return Result.ok('logs.zip');
      },
      async writeArchive() {
        throw new Error('Archive write failed');
      },
    });

    const actualOutcome = await downloadArchive();

    assert.strictEqual(actualOutcome, 'failed');
  });

  it('clears the shared action after a rejected archive write so a later request can retry', async () => {
    const writeError = new Error('Archive write failed');
    const reportedErrors: unknown[] = [];
    let writeCount = 0;
    const downloadArchive = createTestLogArchiveDownloadAction({
      async chooseDestinationPath() {
        return Result.ok('logs.zip');
      },
      async writeArchive() {
        writeCount += 1;
        if (writeCount === 1) {
          throw writeError;
        }
      },
      reportFailure(error) {
        reportedErrors.push(error);
      },
    });

    assert.strictEqual(await downloadArchive(), 'failed');
    assert.strictEqual(reportedErrors.length, 1);
    assert.strictEqual(reportedErrors[0], writeError);
    assert.strictEqual(await downloadArchive(), 'saved');
    assert.strictEqual(reportedErrors.length, 1);
    assert.strictEqual(reportedErrors[0], writeError);
    assert.strictEqual(writeCount, 2);
  });

  it('returns a closed failure outcome and allows retry when failure reporting throws', async () => {
    let chooseCount = 0;
    let failureReportCount = 0;
    const downloadArchive = createTestLogArchiveDownloadAction({
      chooseDestinationPath() {
        chooseCount += 1;
        if (chooseCount === 1) {
          throw new Error('Save dialog unavailable');
        }

        return Promise.resolve(Result.ok('logs.zip'));
      },
      async writeArchive() {},
      reportFailure() {
        failureReportCount += 1;
        throw new Error('Logger unavailable');
      },
    });

    assert.strictEqual(await downloadArchive(), 'failed');
    assert.strictEqual(failureReportCount, 1);
    assert.strictEqual(await downloadArchive(), 'saved');
    assert.strictEqual(chooseCount, 2);
  });

  it('returns the shared archive promise for authorized WebView requests and rejects unauthorized requests', async () => {
    let chooseCount = 0;
    const downloadArchive = createTestLogArchiveDownloadAction({
      chooseDestinationPath() {
        chooseCount += 1;
        return Promise.resolve(Result.err('cancelled'));
      },
      async writeArchive() {},
    });
    const sender = {
      id: 1,
      hostWebContents: {},
      mainFrame: {url: 'https://app.example.com'},
      isDestroyed() {
        return false;
      },
    };
    const event: WebViewIpcEvent = {sender, senderFrame: sender.mainFrame};
    let actionInvocationCount = 0;
    const invokeArchiveDownload: LogArchiveDownloadAction = () => {
      actionInvocationCount += 1;
      return downloadArchive();
    };
    const authorizedHandler = createWebViewLogArchiveDownloadHandler({
      authorizeWebView(candidateEvent) {
        return candidateEvent === event;
      },
      downloadArchive: invokeArchiveDownload,
    });
    const unauthorizedHandler = createWebViewLogArchiveDownloadHandler({
      authorizeWebView() {
        return false;
      },
      downloadArchive: invokeArchiveDownload,
    });
    const throwingAuthorizationHandler = createWebViewLogArchiveDownloadHandler({
      authorizeWebView() {
        throw new Error('Authorization context unavailable');
      },
      downloadArchive: invokeArchiveDownload,
    });
    const sharedDownload = downloadArchive();

    assert.strictEqual(authorizedHandler(event), sharedDownload);
    assert.strictEqual(await unauthorizedHandler(event), 'failed');
    assert.strictEqual(await throwingAuthorizationHandler(event), 'failed');
    assert.strictEqual(await sharedDownload, 'cancelled');
    assert.strictEqual(chooseCount, 1);
    assert.strictEqual(actionInvocationCount, 1);
  });

  it('registers the active promise before a reentrant destination chooser call', async () => {
    const reentrantDownload: {promise: Maybe<Promise<DesktopLogExportOutcome>>} = {
      promise: Maybe.nothing(),
    };
    const downloadArchive = createTestLogArchiveDownloadAction({
      chooseDestinationPath() {
        reentrantDownload.promise = Maybe.just(downloadArchive());
        return Promise.resolve(Result.err('cancelled'));
      },
      async writeArchive() {},
    });

    const firstDownload = downloadArchive();
    assert.strictEqual(await firstDownload, 'cancelled');
    assert.strictEqual(reentrantDownload.promise.isJust, true);
    assert.strictEqual(reentrantDownload.promise.value, firstDownload);
  });

  it('allows a retry after the destination chooser throws synchronously', async () => {
    let chooseCount = 0;
    let writeCount = 0;
    const downloadArchive = createTestLogArchiveDownloadAction({
      chooseDestinationPath() {
        chooseCount += 1;
        if (chooseCount === 1) {
          throw new Error('Save dialog could not open');
        }

        return Promise.resolve(Result.ok('logs.zip'));
      },
      async writeArchive() {
        writeCount += 1;
      },
    });

    const firstDownload = downloadArchive();
    assert.strictEqual(chooseCount, 0);
    assert.strictEqual(await firstDownload, 'failed');
    assert.strictEqual(chooseCount, 1);

    const secondDownload = downloadArchive();

    assert.strictEqual(await secondDownload, 'saved');
    assert.strictEqual(chooseCount, 2);
    assert.strictEqual(writeCount, 1);
  });

  it('shares one in-progress export between concurrent callers', async () => {
    const writeCompletion = Promise.withResolvers<void>();
    let chooseCount = 0;
    let writeCount = 0;
    const downloadArchive = createTestLogArchiveDownloadAction({
      async chooseDestinationPath() {
        chooseCount += 1;

        return Result.ok('logs.zip');
      },
      async writeArchive() {
        writeCount += 1;
        await writeCompletion.promise;
      },
    });

    const firstDownload = downloadArchive();
    const secondDownload = downloadArchive();
    assert.strictEqual(firstDownload, secondDownload);
    writeCompletion.resolve();

    const actualOutcomes = await Promise.all([firstDownload, secondDownload]);

    assert.deepStrictEqual(actualOutcomes, ['saved', 'saved']);
    assert.strictEqual(chooseCount, 1);
    assert.strictEqual(writeCount, 1);
  });

  it('keeps a new request coalesced until the previous outer promise clears its lock', async () => {
    const firstWriteStarted = Promise.withResolvers<void>();
    const firstWriteCompletion = Promise.withResolvers<void>();
    let chooseCount = 0;
    let writeCount = 0;
    const downloadArchive = createTestLogArchiveDownloadAction({
      chooseDestinationPath() {
        chooseCount += 1;

        return Promise.resolve(Result.ok(`logs-${chooseCount}.zip`));
      },
      writeArchive(destinationPath): Promise<void> {
        writeCount += 1;
        if (destinationPath === 'logs-1.zip') {
          firstWriteStarted.resolve();

          return firstWriteCompletion.promise;
        }

        return Promise.resolve();
      },
    });

    async function requestDownloadAfterFirstWriteCompletes(): Promise<DesktopLogExportOutcome> {
      await firstWriteCompletion.promise;

      return downloadArchive();
    }

    const firstDownload = downloadArchive();
    await firstWriteStarted.promise;
    const overlappingDownload = requestDownloadAfterFirstWriteCompletes();
    firstWriteCompletion.resolve();

    const [firstOutcome, overlappingOutcome] = await Promise.all([firstDownload, overlappingDownload]);
    const nextOutcome = await downloadArchive();

    assert.deepStrictEqual([firstOutcome, overlappingOutcome, nextOutcome], ['saved', 'saved', 'saved']);
    assert.strictEqual(chooseCount, 2);
    assert.strictEqual(writeCount, 2);
  });
});

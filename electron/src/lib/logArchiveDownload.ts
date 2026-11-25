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

import {Maybe, Result} from 'true-myth';

import type {DesktopLogExportOutcome} from './desktopLogExport';

import type {WebViewIpcEvent} from '../runtime/webViewIpcAuthorization';

export type LogArchiveDownloadAction = () => Promise<DesktopLogExportOutcome>;

type WebViewLogArchiveDownloadHandler = (event: WebViewIpcEvent) => Promise<DesktopLogExportOutcome>;

export type CreateLogArchiveDownloadActionOptions = {
  readonly chooseDestinationPath: () => Promise<Result<string, 'cancelled'>>;
  readonly writeArchive: (destinationPath: string) => Promise<void>;
  readonly reportFailure: (error: unknown) => void;
};

export type CreateWebViewLogArchiveDownloadHandlerOptions = {
  readonly authorizeWebView: (event: WebViewIpcEvent) => boolean;
  readonly downloadArchive: LogArchiveDownloadAction;
};

export function createLogArchiveDownloadAction(
  options: CreateLogArchiveDownloadActionOptions,
): LogArchiveDownloadAction {
  let activeDownload: Maybe<Promise<DesktopLogExportOutcome>> = Maybe.nothing();

  async function runLogArchiveDownload(): Promise<DesktopLogExportOutcome> {
    try {
      const destinationResult = await options.chooseDestinationPath();
      if (destinationResult.isErr) {
        return destinationResult.error;
      }

      await options.writeArchive(destinationResult.value);
      return 'saved';
    } catch (error: unknown) {
      try {
        options.reportFailure(error);
      } catch {
        // Keep the public outcome closed even when failure reporting itself fails.
      }

      return 'failed';
    }
  }

  async function completeLogArchiveDownload(): Promise<DesktopLogExportOutcome> {
    // Register the shared promise before opening the native save dialog.
    await Promise.resolve();

    try {
      const outcome = await runLogArchiveDownload();
      return outcome;
    } finally {
      activeDownload = Maybe.nothing();
    }
  }

  function downloadLogArchive(): Promise<DesktopLogExportOutcome> {
    if (activeDownload.isJust) {
      return activeDownload.value;
    }

    const download = completeLogArchiveDownload();
    activeDownload = Maybe.just(download);
    return download;
  }

  return downloadLogArchive;
}

export function createWebViewLogArchiveDownloadHandler(
  options: CreateWebViewLogArchiveDownloadHandlerOptions,
): WebViewLogArchiveDownloadHandler {
  return event => {
    let isAuthorized: boolean;
    try {
      isAuthorized = options.authorizeWebView(event);
    } catch {
      return Promise.resolve('failed');
    }

    if (!isAuthorized) {
      return Promise.resolve('failed');
    }

    return options.downloadArchive();
  };
}

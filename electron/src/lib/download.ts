/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import {dialog, SaveDialogOptions} from 'electron';
import * as fs from 'fs-extra';
import imageType from 'image-type';
import {Maybe, Result} from 'true-myth';

import * as path from 'path';

import {DateUtil} from '@wireapp/commons';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export type LogArchiveDownloadOutcome = 'saved' | 'cancelled' | 'failed';

export type LogArchiveDownloadAction = () => Promise<LogArchiveDownloadOutcome>;

export type CreateLogArchiveDownloadActionOptions = {
  readonly chooseDestinationPath: () => Promise<Result<string, 'cancelled' | 'failed'>>;
  readonly writeArchive: (destinationPath: string) => Promise<void>;
};

export function createLogArchiveDownloadAction(
  options: CreateLogArchiveDownloadActionOptions,
): LogArchiveDownloadAction {
  let activeDownload: Maybe<Promise<LogArchiveDownloadOutcome>> = Maybe.nothing();

  function downloadLogArchive(): Promise<LogArchiveDownloadOutcome> {
    if (activeDownload.isJust) {
      return activeDownload.value;
    }

    const download = completeLogArchiveDownload();
    activeDownload = Maybe.just(download);

    return download;
  }

  async function completeLogArchiveDownload(): Promise<LogArchiveDownloadOutcome> {
    // Register the shared promise before opening the native save dialog.
    await Promise.resolve();

    try {
      const downloadOutcome = await runLogArchiveDownload();

      return downloadOutcome;
    } finally {
      activeDownload = Maybe.nothing();
    }
  }

  async function runLogArchiveDownload(): Promise<LogArchiveDownloadOutcome> {
    try {
      const destinationResult = await options.chooseDestinationPath();

      if (destinationResult.isErr) {
        return destinationResult.error;
      }

      await options.writeArchive(destinationResult.value);

      return 'saved';
    } catch (error: unknown) {
      logger.error('Failed to download the desktop log archive.', error);

      return 'failed';
    }
  }

  return downloadLogArchive;
}

export async function chooseLogDownloadPath(timestamp: Date): Promise<Result<string, 'cancelled' | 'failed'>> {
  const options: SaveDialogOptions = {
    filters: [{extensions: ['zip'], name: 'Archives (*.zip)'}],
  };

  const {date: formattedDate, time: formattedTime} = DateUtil.isoFormat(timestamp);

  const formattedTimeShort = formattedTime.replace(/:/g, '-').substr(0, 5);
  const filename = `wire-logs-${formattedDate}-${formattedTimeShort}.zip`;

  try {
    const {canceled, filePath} = await dialog.showSaveDialog({defaultPath: filename, ...options});
    const chosenPath = Maybe.of(filePath);

    if (canceled || chosenPath.isNothing) {
      return Result.err('cancelled');
    }

    return Result.ok(chosenPath.value);
  } catch (error) {
    logger.error(error);

    return Result.err('failed');
  }
}

export async function downloadImage(bytes: Uint8Array, timestamp: Maybe<string>): Promise<void> {
  const detectedImageType = Maybe.of(imageType(bytes));
  const options: SaveDialogOptions = {};

  let filename = suggestFileName(timestamp);

  if (detectedImageType.isJust && detectedImageType.value.ext) {
    options.filters = [
      {
        extensions: [detectedImageType.value.ext],
        name: 'Images',
      },
    ];
    filename += `.${detectedImageType.value.ext}`;
  }

  return downloadFile(bytes, filename, options);
}

export async function downloadFile(bytes: Uint8Array, filename: string, options: SaveDialogOptions): Promise<void> {
  try {
    const saveDialogResult = await dialog.showSaveDialog({defaultPath: filename, ...options});
    const chosenPath = Maybe.of(saveDialogResult.filePath);

    if (chosenPath.isJust) {
      await fs.writeFile(chosenPath.value, bytes);
    }
  } catch (error) {
    logger.error(error);
  }
}

export function suggestFileName(timestamp: Maybe<string>): string {
  const imageDate = timestamp.isJust ? new Date(Number(timestamp.value)) : new Date();
  const {date: formattedDate, time: formattedTime} = DateUtil.isoFormat(imageDate);
  return `Wire ${formattedDate} at ${formattedTime}`.replace(/:/g, '-');
}

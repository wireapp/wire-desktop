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
import {Maybe} from 'true-myth';

import * as path from 'path';

import {DateUtil} from '@wireapp/commons';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export async function chooseLogDownloadPath(timestamp: Date): Promise<Maybe<string>> {
  const options: SaveDialogOptions = {
    filters: [{extensions: ['zip'], name: 'Archives (*.zip)'}],
  };

  const {date: formattedDate, time: formattedTime} = DateUtil.isoFormat(timestamp);

  const formattedTimeShort = formattedTime.replace(/:/g, '-').substr(0, 5);
  const filename = `wire-logs-${formattedDate}-${formattedTimeShort}.zip`;

  try {
    const {filePath: chosenPath} = await dialog.showSaveDialog({defaultPath: filename, ...options});

    return Maybe.of(chosenPath);
  } catch (error) {
    logger.error(error);

    return Maybe.nothing<string>();
  }
}

export type DownloadLogArchiveOptions = {
  chooseDestinationPath: () => Promise<Maybe<string>>;
  writeArchive: (destinationPath: string) => Promise<void>;
};

export async function downloadLogArchive(options: DownloadLogArchiveOptions): Promise<void> {
  const destinationPath = await options.chooseDestinationPath();

  if (destinationPath.isJust) {
    await options.writeArchive(destinationPath.value);
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

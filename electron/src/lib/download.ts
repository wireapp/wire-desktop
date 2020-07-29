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

import {DateUtil} from '@wireapp/commons';
import {dialog, SaveDialogOptions} from 'electron';
import imageType from 'image-type';
import * as fs from 'fs-extra';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export const downloadLogs = async (bytes: Uint8Array, timestamp: Date = new Date()) => {
  const options: SaveDialogOptions = {
    filters: [{extensions: ['zip'], name: 'Archives (*.zip)'}],
  };

  const {date: formattedDate, time: formattedTime} = DateUtil.isoFormat(timestamp);

  const formattedTimeShort = formattedTime.replace(/:/g, '-').substr(0, 5);
  const filename = `wire-logs-${formattedDate}-${formattedTimeShort}.zip`;

  return downloadFile(bytes, filename, options);
};

export const downloadImage = async (bytes: Uint8Array, timestamp?: string): Promise<void> => {
  const type = imageType(bytes);
  const options: SaveDialogOptions = {};

  let filename = suggestFileName(timestamp);

  if (type?.ext) {
    options.filters = [
      {
        extensions: [type.ext],
        name: 'Images',
      },
    ];
    filename += `.${type.ext}`;
  }

  return downloadFile(bytes, filename, options);
};

export const downloadFile = async (bytes: Uint8Array, filename: string, options?: SaveDialogOptions): Promise<void> => {
  try {
    const {filePath: chosenPath} = await dialog.showSaveDialog({defaultPath: filename, ...options});
    if (chosenPath) {
      await fs.writeFile(chosenPath, bytes);
    }
  } catch (error) {
    logger.error(error);
  }
};

export const suggestFileName = (timestamp?: string): string => {
  const imageDate = timestamp ? new Date(Number(timestamp)) : new Date();
  const {date: formattedDate, time: formattedTime} = DateUtil.isoFormat(imageDate);
  return `Wire ${formattedDate} at ${formattedTime}`.replace(/:/g, '-');
};

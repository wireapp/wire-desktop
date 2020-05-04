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
import * as fs from 'fs-extra';
import imageType from 'image-type';

export const downloadImage = async (bytes: Uint8Array, timestamp?: string) => {
  const type = imageType(bytes);
  const options: SaveDialogOptions = {};

  const imageDate = timestamp ? new Date(Number(timestamp)) : new Date();
  const {date: formattedDate, time: formattedTime} = DateUtil.isoFormat(imageDate);
  const filename = `Wire ${formattedDate} at ${formattedTime}`;
  options.defaultPath = filename;

  if (type?.ext) {
    options.filters = [
      {
        extensions: [type.ext],
        name: 'Images',
      },
    ];
    options.defaultPath += `.${type.ext}`;
  }

  const {filePath: chosenPath} = await dialog.showSaveDialog(options);
  if (chosenPath) {
    await fs.writeFile(chosenPath, new Buffer(bytes.buffer));
  }
};

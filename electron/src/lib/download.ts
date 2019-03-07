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

import {SaveDialogOptions, dialog} from 'electron';
import * as fs from 'fs';
import imageType from 'image-type';
import * as moment from 'moment';

const downloadImage = (bytes: Uint8Array, timestamp?: string) => {
  return new Promise((resolve, reject) => {
    const type = imageType(bytes);
    const options: SaveDialogOptions = {};

    const dateObj = new Date(Number(timestamp));
    if (!isNaN(dateObj.getTime())) {
      const momentObj = moment(dateObj);
      const filename = `Wire ${momentObj.format('YYYY-MM-DD')} at ${momentObj.format('H.mm.ss')}`;
      options.defaultPath = filename;
    }

    if (type && type.ext) {
      options.filters = [
        {
          extensions: [type.ext],
          name: 'Images',
        },
      ];
      options.defaultPath += `.${type.ext}`;
    }

    dialog.showSaveDialog(options, chosenPath => {
      if (chosenPath) {
        fs.writeFile(chosenPath, new Buffer(bytes.buffer), error => (error ? reject(error) : resolve()));
      }
    });
  });
};

export {downloadImage};

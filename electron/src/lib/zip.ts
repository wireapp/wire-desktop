/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import JSZip from 'jszip';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export const zipFiles = async (files: Record<string, Uint8Array>): Promise<JSZip> => {
  const zip = new JSZip();

  try {
    for (const filename in files) {
      zip.file(filename, files[filename], {binary: true});
    }
  } catch (error) {
    logger.error(error);
  }

  return zip;
};

export const createFile = (zip: JSZip): Promise<Uint8Array> => {
  return zip.generateAsync({compression: 'DEFLATE', type: 'uint8array'});
};

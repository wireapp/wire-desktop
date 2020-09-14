/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import {app} from 'electron';
import * as fs from 'fs-extra';
import * as globby from 'globby';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export const logDir = path.join(app.getPath('userData'), 'logs');

export function getLogFilenames(base: string = logDir, absolute: boolean = false): Promise<string[]> {
  return globby('**/*.{log,old}', {absolute, cwd: base, followSymbolicLinks: false, onlyFiles: true});
}

export async function gatherLogs(): Promise<Record<string, Uint8Array>> {
  const logFiles: Record<string, Uint8Array> = {};

  const relativeFilePaths = await getLogFilenames();

  for (const relativeFilePath of relativeFilePaths) {
    const resolvedPath = path.join(logDir, relativeFilePath);
    try {
      const fileContent = await fs.readFile(resolvedPath);
      logFiles[relativeFilePath] = fileContent;
    } catch (error) {
      logger.error(error);
    }
  }

  return logFiles;
}

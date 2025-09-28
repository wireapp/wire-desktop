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
import globby from 'globby';

import * as path from 'node:path';

import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export const logDir = path.join(app.getPath('userData'), 'logs');

export function getLogFilenames(base: string = logDir, absolute: boolean = false): string[] {
  return globby.sync('**/*.{log,old}', {absolute, cwd: base, followSymbolicLinks: false, onlyFiles: true});
}

export async function gatherLogs(): Promise<Record<string, Uint8Array>> {
  const logFiles: Record<string, Uint8Array> = {};

  const relativeFilePaths = getLogFilenames();

  for (const relativeFilePath of relativeFilePaths) {
    if (relativeFilePath.includes('..') || path.isAbsolute(relativeFilePath)) {
      logger.warn(`Skipping unsafe file path: ${relativeFilePath}`);
      continue;
    }

    const resolvedPath = path.join(logDir, relativeFilePath);
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const fileContent = await fs.readFile(resolvedPath);
      const logFilesMap = new Map(Object.entries(logFiles));
      logFilesMap.set(relativeFilePath, fileContent);
      Object.assign(logFiles, Object.fromEntries(logFilesMap));
    } catch (error) {
      logger.error(error);
    }
  }

  return logFiles;
}

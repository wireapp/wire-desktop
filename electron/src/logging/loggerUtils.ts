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

import * as fs from 'fs-extra';

import * as path from 'path';

import {getLogger} from './getLogger';
import {getLogFilenames as getLogFilenamesFromRoot, LogFileDiscoveryOptions} from './logFiles';
import {getLogDirectory} from './logPaths';

const logger = getLogger(path.basename(__filename));

export function getLogFilenames(parameters: LogFileDiscoveryOptions): string[] {
  return getLogFilenamesFromRoot(parameters);
}

export async function gatherLogs(): Promise<Record<string, Uint8Array>> {
  const logFiles: Record<string, Uint8Array> = {};
  const logDirectory = getLogDirectory();

  const relativeFilePaths = getLogFilenames({absolute: false, baseDirectory: logDirectory});

  for (const relativeFilePath of relativeFilePaths) {
    const resolvedPath = path.join(logDirectory, relativeFilePath);
    try {
      const fileContent = await fs.readFile(resolvedPath);
      logFiles[relativeFilePath] = fileContent;
    } catch (error) {
      logger.error(error);
    }
  }

  return logFiles;
}

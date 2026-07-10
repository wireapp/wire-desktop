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
import globby from 'globby';
import * as logdown from 'logdown';

import * as path from 'path';

import {getLogDirectory} from './getLogDirectory';

import {getLogger} from '../logging/getLogger';

function getLogExportLogger(): logdown.Logger {
  return getLogger(path.basename(__filename));
}

export function getLogFilenames(base: string = getLogDirectory(), absolute: boolean = false): string[] {
  return globby.sync('**/*.{log,old}', {absolute, cwd: base, followSymbolicLinks: false, onlyFiles: true});
}

export async function gatherLogs(logDirectory: string = getLogDirectory()): Promise<Record<string, Uint8Array>> {
  const logFiles: Record<string, Uint8Array> = {};

  const relativeFilePaths = getLogFilenames(logDirectory);

  for (const relativeFilePath of relativeFilePaths) {
    const resolvedPath = path.join(logDirectory, relativeFilePath);
    try {
      const fileContent = await fs.readFile(resolvedPath);
      logFiles[relativeFilePath] = fileContent;
    } catch (error) {
      getLogExportLogger().error(error);
    }
  }

  return logFiles;
}

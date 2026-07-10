/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import {getLogFilenames} from './loggerUtils';

export type LogFileMigrationLogger = {
  error: (message: string) => void;
  log: (message: string) => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function renameLogFileExtensions(
  files: string[],
  oldExtension: string,
  newExtension: string,
  logger: LogFileMigrationLogger,
): void {
  for (const file of files) {
    try {
      const fileStat = fs.statSync(file);
      if (fileStat.isFile() && file.endsWith(oldExtension)) {
        fs.renameSync(file, file.replace(oldExtension, newExtension));
      }
    } catch (error) {
      logger.error(`Failed to rename log file: "${getErrorMessage(error)}"`);
    }
  }
}

export function renameWebviewLogFiles(logDirectory: string, logger: LogFileMigrationLogger): void {
  try {
    const logFiles = getLogFilenames(logDirectory, true);
    renameLogFileExtensions(logFiles, '.log', '.old', logger);
  } catch (error) {
    logger.log(`Failed to read log directory with error: ${getErrorMessage(error)}`);
  }
}

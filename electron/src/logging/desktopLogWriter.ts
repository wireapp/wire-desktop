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

import {
  BoundedLogWriter,
  BoundedLogWriterDependencies,
  createBoundedLogWriter,
  LogRotationNotificationParameters,
  WriteLogMessageParameters,
} from './boundedLogWriter';
import {cleanupDesktopLogs, DESKTOP_LOG_RETENTION_POLICY} from './logCleanup';
import {getLogDirectory} from './logPaths';

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function createFileSystemDependencies(): BoundedLogWriterDependencies {
  return {
    async appendFile(filePath: string, content: string): Promise<void> {
      await fs.appendFile(filePath, content);
    },
    async ensureDirectory(directoryPath: string): Promise<void> {
      await fs.ensureDir(directoryPath);
    },
    getCurrentTimeMilliseconds: (): number => {
      return Date.now();
    },
    async getFileSize(filePath: string): Promise<number> {
      try {
        const fileStatistics = await fs.stat(filePath);

        return fileStatistics.isFile() ? fileStatistics.size : 0;
      } catch (error) {
        if (isMissingFileError(error)) {
          return 0;
        }

        throw error;
      }
    },
    async moveFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
      await fs.move(sourceFilePath, destinationFilePath, {overwrite: false});
    },
    async pathExists(filePath: string): Promise<boolean> {
      return fs.pathExists(filePath);
    },
  };
}

const desktopBoundedLogWriter: BoundedLogWriter = createBoundedLogWriter({
  async afterRotation(rotationParameters: LogRotationNotificationParameters): Promise<void> {
    await cleanupDesktopLogs({
      activeFilePaths: rotationParameters.activeFilePaths,
      logDirectory: getLogDirectory(),
      policy: DESKTOP_LOG_RETENTION_POLICY,
    });
  },
  dependencies: createFileSystemDependencies(),
  maximumFileSizeBytes: 10 * 1024 * 1024,
});

export function writeBoundedLogMessage(parameters: WriteLogMessageParameters): Promise<void> {
  return desktopBoundedLogWriter.write(parameters);
}

export function getActiveLogFilePaths(): ReadonlySet<string> {
  return desktopBoundedLogWriter.getActiveFilePaths();
}

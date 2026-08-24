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
import {Maybe} from 'true-myth';

import * as path from 'path';

import {getLogFilenames} from './logFiles';
import {LogFileMetadata, LogRetentionPlanParameters, LogRetentionPolicy, planLogCleanup} from './logRetention';

export const DESKTOP_LOG_MAXIMUM_AGE_MILLISECONDS = 7 * 24 * 60 * 60 * 1_000;
export const DESKTOP_LOG_MAXIMUM_TOTAL_SIZE_BYTES = 100 * 1024 * 1024;
export const DESKTOP_LOG_RETENTION_POLICY: LogRetentionPolicy = {
  maximumAgeMilliseconds: DESKTOP_LOG_MAXIMUM_AGE_MILLISECONDS,
  maximumTotalSizeBytes: DESKTOP_LOG_MAXIMUM_TOTAL_SIZE_BYTES,
};

export type LogCleanupDependencies = {
  discoverLogFilePaths: (logDirectory: string) => Promise<readonly string[]>;
  getCurrentTimeMilliseconds: () => number;
  getFileMetadata: (filePath: string) => Promise<LogFileMetadata>;
  removeEmptyDirectory: (directoryPath: string) => Promise<void>;
  removeFile: (filePath: string) => Promise<void>;
  reportFailure: (message: string, error: unknown) => void;
};

export type RunLogCleanupParameters = {
  activeFilePaths: ReadonlySet<string>;
  logDirectory: string;
  policy: LogRetentionPolicy;
};

export type LogCleanup = {
  run: (parameters: RunLogCleanupParameters) => Promise<void>;
};

type CleanupFileMetadataParameters = {
  filePaths: readonly string[];
  dependencies: LogCleanupDependencies;
};

function getParentDirectories(filePaths: readonly string[]): string[] {
  const parentDirectories = new Set(
    filePaths.map(filePath => {
      return path.dirname(filePath);
    }),
  );

  return [...parentDirectories].toSorted((firstPath, secondPath) => {
    const pathLengthDifference = secondPath.length - firstPath.length;

    if (pathLengthDifference !== 0) {
      return pathLengthDifference;
    }

    if (firstPath < secondPath) {
      return -1;
    }

    if (firstPath > secondPath) {
      return 1;
    }

    return 0;
  });
}

async function getCleanupFileMetadata(parameters: CleanupFileMetadataParameters): Promise<LogFileMetadata[]> {
  const fileMetadata: LogFileMetadata[] = [];

  for (const filePath of parameters.filePaths) {
    try {
      fileMetadata.push(await parameters.dependencies.getFileMetadata(filePath));
    } catch (error) {
      parameters.dependencies.reportFailure(`Failed to inspect log file "${filePath}"`, error);
    }
  }

  return fileMetadata;
}

async function removePlannedFiles(filePaths: readonly string[], dependencies: LogCleanupDependencies): Promise<void> {
  for (const filePath of filePaths) {
    try {
      await dependencies.removeFile(filePath);
    } catch (error) {
      dependencies.reportFailure(`Failed to remove log file "${filePath}"`, error);
    }
  }
}

async function removeParentDirectories(
  filePaths: readonly string[],
  dependencies: LogCleanupDependencies,
): Promise<void> {
  for (const directoryPath of getParentDirectories(filePaths)) {
    try {
      await dependencies.removeEmptyDirectory(directoryPath);
    } catch (error) {
      dependencies.reportFailure(`Failed to remove empty log directory "${directoryPath}"`, error);
    }
  }
}

async function runCleanup(parameters: RunLogCleanupParameters, dependencies: LogCleanupDependencies): Promise<void> {
  let logFilePaths: readonly string[];

  try {
    logFilePaths = await dependencies.discoverLogFilePaths(parameters.logDirectory);
  } catch (error) {
    dependencies.reportFailure(`Failed to discover log files in "${parameters.logDirectory}"`, error);

    return;
  }

  const fileMetadata = await getCleanupFileMetadata({dependencies, filePaths: logFilePaths});
  const retentionPlanParameters: LogRetentionPlanParameters = {
    activeFilePaths: parameters.activeFilePaths,
    currentTimeMilliseconds: dependencies.getCurrentTimeMilliseconds(),
    files: fileMetadata,
    policy: parameters.policy,
  };
  const retentionPlan = planLogCleanup(retentionPlanParameters);

  await removePlannedFiles(retentionPlan.filesToDelete, dependencies);
  await removeParentDirectories(logFilePaths, dependencies);
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function isNonEmptyDirectoryError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error.code === 'ENOTEMPTY' || error.code === 'EEXIST');
}

function createFileSystemDependencies(
  reportFailure: (message: string, error: unknown) => void,
): LogCleanupDependencies {
  return {
    async discoverLogFilePaths(logDirectory: string): Promise<readonly string[]> {
      return getLogFilenames({absolute: true, baseDirectory: logDirectory});
    },
    getCurrentTimeMilliseconds: (): number => {
      return Date.now();
    },
    async getFileMetadata(filePath: string): Promise<LogFileMetadata> {
      const fileStatistics = await fs.lstat(filePath);

      return {
        filePath,
        fileSizeBytes: fileStatistics.isFile() ? fileStatistics.size : 0,
        isSymbolicLink: fileStatistics.isSymbolicLink(),
        modifiedTimeMilliseconds: fileStatistics.mtimeMs,
      };
    },
    async removeEmptyDirectory(directoryPath: string): Promise<void> {
      try {
        const directoryStatistics = await fs.lstat(directoryPath);

        if (directoryStatistics.isSymbolicLink() || directoryStatistics.isDirectory() === false) {
          return;
        }

        await fs.rmdir(directoryPath);
      } catch (error) {
        if (isMissingPathError(error) || isNonEmptyDirectoryError(error)) {
          return;
        }

        throw error;
      }
    },
    async removeFile(filePath: string): Promise<void> {
      await fs.unlink(filePath);
    },
    reportFailure,
  };
}

export function createLogCleanup(dependencies: LogCleanupDependencies): LogCleanup {
  let currentCleanup: Maybe<Promise<void>> = Maybe.nothing<Promise<void>>();

  async function run(parameters: RunLogCleanupParameters): Promise<void> {
    if (currentCleanup.isJust) {
      await currentCleanup.value;

      return;
    }

    const cleanupPromise = runCleanup(parameters, dependencies);
    currentCleanup = Maybe.just(cleanupPromise);

    try {
      await cleanupPromise;
    } finally {
      currentCleanup = Maybe.nothing<Promise<void>>();
    }
  }

  return {run};
}

const desktopLogCleanup = createLogCleanup(
  createFileSystemDependencies((message: string, error: unknown): void => {
    console.error(message, error);
  }),
);

export function cleanupDesktopLogs(parameters: RunLogCleanupParameters): Promise<void> {
  return desktopLogCleanup.run(parameters);
}

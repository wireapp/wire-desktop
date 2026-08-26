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

import {Maybe} from 'true-myth';

import * as os from 'os';
import * as path from 'path';

import {LogMaintenanceCoordinator} from './logMaintenance';

export type BoundedLogWriterDependencies = {
  appendFile: (filePath: string, content: string) => Promise<void>;
  ensureDirectory: (directoryPath: string) => Promise<void>;
  getCurrentTimeMilliseconds: () => number;
  getFileSize: (filePath: string) => Promise<number>;
  moveFile: (sourceFilePath: string, destinationFilePath: string) => Promise<void>;
  pathExists: (filePath: string) => Promise<boolean>;
};

export type CreateBoundedLogWriterParameters = {
  afterWrite: () => Promise<void>;
  dependencies: BoundedLogWriterDependencies;
  maintenanceCoordinator: LogMaintenanceCoordinator;
  maximumFileSizeBytes: number;
};

export type WriteLogMessageParameters = {
  logFilePath: string;
  message: string;
};

export type BoundedLogWriter = {
  runMaintenance<Result>(operation: () => Promise<Result>): Promise<Result>;
  write: (parameters: WriteLogMessageParameters) => Promise<void>;
};

type PendingWrites = Map<string, Promise<void>>;

type FindRotatedLogPathParameters = {
  collisionIndex: number;
  currentTimeMilliseconds: number;
  logFilePath: string;
  pathExists: (filePath: string) => Promise<boolean>;
};

type RotateLogFileParameters = {
  collisionIndex: number;
  currentTimeMilliseconds: number;
  dependencies: BoundedLogWriterDependencies;
  logFilePath: string;
};

type WriteLogEntryParameters = {
  dependencies: BoundedLogWriterDependencies;
  maximumFileSizeBytes: number;
  writeParameters: WriteLogMessageParameters;
};

type WriteLogEntryResult = {
  requiresPostWriteCleanup: boolean;
};

function isExistingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error.code === 'EEXIST' || error.code === 'ENOTEMPTY');
}

async function findRotatedLogPath(parameters: FindRotatedLogPathParameters): Promise<string> {
  const rotatedLogPath = `${parameters.logFilePath}.${parameters.currentTimeMilliseconds}-${parameters.collisionIndex}.old`;
  const rotatedLogPathExists = await parameters.pathExists(rotatedLogPath);

  if (rotatedLogPathExists === false) {
    return rotatedLogPath;
  }

  return findRotatedLogPath({
    ...parameters,
    collisionIndex: parameters.collisionIndex + 1,
  });
}

async function rotateLogFile(parameters: RotateLogFileParameters): Promise<void> {
  const rotatedLogPath = await findRotatedLogPath({
    collisionIndex: parameters.collisionIndex,
    currentTimeMilliseconds: parameters.currentTimeMilliseconds,
    logFilePath: parameters.logFilePath,
    pathExists: parameters.dependencies.pathExists,
  });

  try {
    await parameters.dependencies.moveFile(parameters.logFilePath, rotatedLogPath);
  } catch (error) {
    if (isExistingFileError(error)) {
      await rotateLogFile({...parameters, collisionIndex: parameters.collisionIndex + 1});

      return;
    }

    throw error;
  }
}

async function writeLogEntry(parameters: WriteLogEntryParameters): Promise<WriteLogEntryResult> {
  const logEntry = `${parameters.writeParameters.message}${os.EOL}`;
  const logEntrySizeBytes = Buffer.byteLength(logEntry);

  await parameters.dependencies.ensureDirectory(path.dirname(parameters.writeParameters.logFilePath));

  const currentFileSizeBytes = await parameters.dependencies.getFileSize(parameters.writeParameters.logFilePath);
  const wouldExceedMaximumFileSize =
    currentFileSizeBytes > 0 && currentFileSizeBytes + logEntrySizeBytes > parameters.maximumFileSizeBytes;
  let didRotate = false;

  if (wouldExceedMaximumFileSize) {
    await rotateLogFile({
      collisionIndex: 0,
      currentTimeMilliseconds: parameters.dependencies.getCurrentTimeMilliseconds(),
      dependencies: parameters.dependencies,
      logFilePath: parameters.writeParameters.logFilePath,
    });
    didRotate = true;
  }

  await parameters.dependencies.appendFile(parameters.writeParameters.logFilePath, logEntry);

  return {requiresPostWriteCleanup: didRotate || logEntrySizeBytes > parameters.maximumFileSizeBytes};
}

function removePendingWrite(pendingWrites: PendingWrites, logFilePath: string, pendingWrite: Promise<void>): void {
  if (pendingWrites.get(logFilePath) === pendingWrite) {
    pendingWrites.delete(logFilePath);
  }
}

type RunQueuedWriteParameters = {
  afterWrite: () => Promise<void>;
  maintenanceCoordinator: LogMaintenanceCoordinator;
  maximumFileSizeBytes: number;
  previousWrite: Promise<void>;
  writeParameters: WriteLogMessageParameters;
  dependencies: BoundedLogWriterDependencies;
};

async function runQueuedWrite(parameters: RunQueuedWriteParameters): Promise<void> {
  try {
    await parameters.previousWrite;
  } catch {
    // A failed previous write must not prevent the next queued write.
  }

  const writeResult = await parameters.maintenanceCoordinator.runWrite(() => {
    return writeLogEntry({
      dependencies: parameters.dependencies,
      maximumFileSizeBytes: parameters.maximumFileSizeBytes,
      writeParameters: parameters.writeParameters,
    });
  });

  if (writeResult.requiresPostWriteCleanup) {
    await parameters.afterWrite();
  }
}

export function createBoundedLogWriter(parameters: CreateBoundedLogWriterParameters): BoundedLogWriter {
  const pendingWrites: PendingWrites = new Map();

  function writeLogMessage(writeParameters: WriteLogMessageParameters): Promise<void> {
    const previousWrite = Maybe.of(pendingWrites.get(writeParameters.logFilePath)).unwrapOr(Promise.resolve());
    const writeOperation = runQueuedWrite({
      afterWrite: parameters.afterWrite,
      dependencies: parameters.dependencies,
      maintenanceCoordinator: parameters.maintenanceCoordinator,
      maximumFileSizeBytes: parameters.maximumFileSizeBytes,
      previousWrite,
      writeParameters,
    });

    let pendingWrite: Promise<void> = Promise.resolve();

    async function removePendingWriteAfterCompletion(): Promise<void> {
      try {
        await writeOperation;
      } finally {
        removePendingWrite(pendingWrites, writeParameters.logFilePath, pendingWrite);
      }
    }

    pendingWrite = removePendingWriteAfterCompletion();
    pendingWrites.set(writeParameters.logFilePath, pendingWrite);

    return pendingWrite;
  }

  return {
    runMaintenance: parameters.maintenanceCoordinator.runMaintenance,
    write: writeLogMessage,
  };
}

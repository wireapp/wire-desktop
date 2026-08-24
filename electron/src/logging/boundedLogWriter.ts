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

export type BoundedLogWriterDependencies = {
  appendFile: (filePath: string, content: string) => Promise<void>;
  ensureDirectory: (directoryPath: string) => Promise<void>;
  getCurrentTimeMilliseconds: () => number;
  getFileSize: (filePath: string) => Promise<number>;
  moveFile: (sourceFilePath: string, destinationFilePath: string) => Promise<void>;
  pathExists: (filePath: string) => Promise<boolean>;
};

export type CreateBoundedLogWriterParameters = {
  afterRotation: (parameters: LogRotationNotificationParameters) => Promise<void>;
  dependencies: BoundedLogWriterDependencies;
  maximumFileSizeBytes: number;
};

export type WriteLogMessageParameters = {
  logFilePath: string;
  message: string;
};

export type LogRotationNotificationParameters = {
  activeFilePaths: ReadonlySet<string>;
  logFilePath: string;
};

export type BoundedLogWriter = {
  getActiveFilePaths: () => ReadonlySet<string>;
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
  afterRotation: (parameters: LogRotationNotificationParameters) => Promise<void>;
  dependencies: BoundedLogWriterDependencies;
  getActiveFilePaths: () => ReadonlySet<string>;
  maximumFileSizeBytes: number;
  writeParameters: WriteLogMessageParameters;
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

async function writeLogEntry(parameters: WriteLogEntryParameters): Promise<void> {
  const logEntry = `${parameters.writeParameters.message}${os.EOL}`;
  const logEntrySizeBytes = Buffer.byteLength(logEntry);

  await parameters.dependencies.ensureDirectory(path.dirname(parameters.writeParameters.logFilePath));

  const currentFileSizeBytes = await parameters.dependencies.getFileSize(parameters.writeParameters.logFilePath);
  const wouldExceedMaximumFileSize =
    currentFileSizeBytes > 0 && currentFileSizeBytes + logEntrySizeBytes > parameters.maximumFileSizeBytes;

  if (wouldExceedMaximumFileSize) {
    await rotateLogFile({
      collisionIndex: 0,
      currentTimeMilliseconds: parameters.dependencies.getCurrentTimeMilliseconds(),
      dependencies: parameters.dependencies,
      logFilePath: parameters.writeParameters.logFilePath,
    });
    await parameters.afterRotation({
      activeFilePaths: parameters.getActiveFilePaths(),
      logFilePath: parameters.writeParameters.logFilePath,
    });
  }

  await parameters.dependencies.appendFile(parameters.writeParameters.logFilePath, logEntry);
}

function removePendingWrite(pendingWrites: PendingWrites, logFilePath: string, pendingWrite: Promise<void>): void {
  if (pendingWrites.get(logFilePath) === pendingWrite) {
    pendingWrites.delete(logFilePath);
  }
}

function ignorePreviousWriteFailure(): void {}

export function createBoundedLogWriter(parameters: CreateBoundedLogWriterParameters): BoundedLogWriter {
  const pendingWrites: PendingWrites = new Map();

  function writeLogMessage(writeParameters: WriteLogMessageParameters): Promise<void> {
    const previousWrite = Maybe.of(pendingWrites.get(writeParameters.logFilePath)).unwrapOr(Promise.resolve());
    const writeOperation = previousWrite.catch(ignorePreviousWriteFailure).then(() => {
      return writeLogEntry({
        afterRotation: parameters.afterRotation,
        dependencies: parameters.dependencies,
        getActiveFilePaths,
        maximumFileSizeBytes: parameters.maximumFileSizeBytes,
        writeParameters,
      });
    });

    let pendingWrite = Promise.resolve();
    pendingWrite = writeOperation.then(
      () => {
        return removePendingWrite(pendingWrites, writeParameters.logFilePath, pendingWrite);
      },
      error => {
        removePendingWrite(pendingWrites, writeParameters.logFilePath, pendingWrite);

        throw error;
      },
    );
    pendingWrites.set(writeParameters.logFilePath, pendingWrite);

    return pendingWrite;
  }

  function getActiveFilePaths(): ReadonlySet<string> {
    return new Set(pendingWrites.keys());
  }

  return {getActiveFilePaths, write: writeLogMessage};
}

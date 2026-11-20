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

import type {ZipArchive} from 'archiver';
import noop from 'lodash/noop';
import {Maybe} from 'true-myth';

import * as path from 'path';
import {Writable} from 'stream';
import {finished} from 'stream/promises';

import {logFileIdentityChangedErrorCode} from './logPermissions';

export type LogSnapshotFile = {
  absolutePath: string;
  relativePath: string;
};

export type LogSnapshot = {
  directoryPath: string;
  files: readonly LogSnapshotFile[];
};

export type LogSnapshotFileMetadata = {
  linkCount: number;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
  mode: number;
  ownerId: number;
};

export type LogSnapshotFileSystemDependencies = {
  copyFile: (sourceFilePath: string, destinationFilePath: string) => Promise<void>;
  createTemporaryDirectory: (temporaryDirectoryPrefix: string) => Promise<string>;
  ensureDirectory: (rootDirectoryPath: string, directoryPath: string) => Promise<void>;
  getFileMetadata: (filePath: string) => Promise<LogSnapshotFileMetadata>;
  protectFile: (filePath: string) => Promise<void>;
  removeDirectory: (directoryPath: string) => Promise<void>;
};

export type CreateLogSnapshotOptions = {
  cleanup: () => Promise<void>;
  discoverLogFilePaths: () => readonly string[];
  logDirectory: string;
  reportFailure: (message: string, error: unknown) => void;
  runMaintenance<Result>(operation: () => Promise<Result>): Promise<Result>;
  temporaryDirectoryPrefix: string;
} & LogSnapshotFileSystemDependencies;

export type StreamLogFilesToZipOptions = {
  destinationPath: string;
  snapshotFiles: readonly LogSnapshotFile[];
} & LogArchiveDependencies;

export type LogArchiveDependencies = {
  createArchive: () => ZipArchive;
  createOutputStream: (destinationPath: string) => Writable;
  createTemporaryArchiveDirectory: (destinationPath: string) => Promise<string>;
  commitArchive: (sourcePath: string, destinationPath: string) => Promise<void>;
  removeDirectory: (directoryPath: string) => Promise<void>;
  reportFailure: (message: string, error: unknown) => void;
};

export type StreamSnapshotOptions = {
  destinationPath: string;
  snapshotFiles: readonly LogSnapshotFile[];
};

export type ExportLogFilesOptions = {
  createSnapshot: () => Promise<LogSnapshot>;
  destinationPath: string;
  removeSnapshotDirectory: (directoryPath: string) => Promise<void>;
  reportFailure: (message: string, error: unknown) => void;
  streamSnapshot: (options: StreamSnapshotOptions) => Promise<void>;
};

type ResolvePathWithinDirectoryOptions = {
  directoryPath: string;
  relativePath: string;
};

type CopyLogFileToSnapshotOptions = {
  logDirectory: string;
  relativePath: string;
  snapshotDirectoryPath: string;
  sourceFilePath: string;
  snapshotFilePath: string;
} & Pick<LogSnapshotFileSystemDependencies, 'copyFile' | 'ensureDirectory' | 'getFileMetadata' | 'protectFile'>;

type GetSafeSourceFileMetadataOptions = {
  ensureDirectory: LogSnapshotFileSystemDependencies['ensureDirectory'];
  logDirectory: string;
  sourceFilePath: string;
  getFileMetadata: LogSnapshotFileSystemDependencies['getFileMetadata'];
};

export const logSourceChangedErrorCode = 'ERR_WIRE_LOG_SOURCE_CHANGED';

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function createLogSourceChangedError(sourceFilePath: string, cause: unknown): Error {
  const error = new Error(`Log source changed while creating its snapshot: ${sourceFilePath}`);

  Object.assign(error, {cause, code: logSourceChangedErrorCode});

  return error;
}

function isLogSourceChangedError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === logSourceChangedErrorCode;
}

export function resolvePathWithinDirectory(options: ResolvePathWithinDirectoryOptions): string {
  const resolvedDirectoryPath = path.resolve(options.directoryPath);

  if (options.relativePath.length === 0 || path.isAbsolute(options.relativePath)) {
    throw new Error(`Log path must be a non-empty relative path: ${options.relativePath}`);
  }

  const resolvedPath = path.resolve(resolvedDirectoryPath, options.relativePath);
  const relativeResolvedPath = path.relative(resolvedDirectoryPath, resolvedPath);
  const isOutsideDirectory =
    relativeResolvedPath === '' ||
    relativeResolvedPath === '..' ||
    relativeResolvedPath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeResolvedPath);

  if (isOutsideDirectory) {
    throw new Error(`Log path escapes its directory: ${options.relativePath}`);
  }

  return resolvedPath;
}

function getArchiveRelativePath(relativePath: string): string {
  return path.normalize(relativePath).split(path.sep).join('/');
}

async function getSafeSourceFileMetadata(
  options: GetSafeSourceFileMetadataOptions,
): Promise<Maybe<LogSnapshotFileMetadata>> {
  const {ensureDirectory, getFileMetadata} = options;
  const resolvedLogDirectory = path.resolve(options.logDirectory);
  const sourceRelativePath = path.relative(resolvedLogDirectory, options.sourceFilePath);
  const sourcePathParts = sourceRelativePath.split(path.sep);

  if (
    sourceRelativePath.length === 0 ||
    sourceRelativePath === '..' ||
    sourceRelativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(sourceRelativePath)
  ) {
    throw new Error(`Log source file is outside the Desktop log root: ${options.sourceFilePath}`);
  }

  const rootMetadata = await getFileMetadata(resolvedLogDirectory);

  if (rootMetadata.isSymbolicLink || !rootMetadata.isDirectory) {
    throw new Error(`Desktop log root is not a real directory: ${resolvedLogDirectory}`);
  }

  if (process.platform !== 'win32' && rootMetadata.ownerId !== process.getuid?.()) {
    throw new Error(`Desktop log root is not owned by the current user: ${resolvedLogDirectory}`);
  }

  await ensureDirectory(resolvedLogDirectory, resolvedLogDirectory);

  let currentPath = resolvedLogDirectory;
  let sourceFileMetadata: Maybe<LogSnapshotFileMetadata> = Maybe.nothing<LogSnapshotFileMetadata>();

  for (const [pathIndex, pathPart] of sourcePathParts.entries()) {
    currentPath = path.join(currentPath, pathPart);
    const currentFileMetadata = await getFileMetadata(currentPath);
    sourceFileMetadata = Maybe.just(currentFileMetadata);

    if (currentFileMetadata.isSymbolicLink === true) {
      return Maybe.nothing<LogSnapshotFileMetadata>();
    }

    if (pathIndex < sourcePathParts.length - 1 && currentFileMetadata.isDirectory) {
      await ensureDirectory(resolvedLogDirectory, currentPath);
    }

    if (currentFileMetadata.isFile && currentFileMetadata.linkCount > 1) {
      throw new Error(`Log file has multiple hard links: ${currentPath}`);
    }

    if (process.platform !== 'win32' && currentFileMetadata.ownerId !== process.getuid?.()) {
      throw new Error(`Log file is not owned by the current user: ${currentPath}`);
    }

    if (pathIndex < sourcePathParts.length - 1 && !currentFileMetadata.isDirectory) {
      return Maybe.nothing<LogSnapshotFileMetadata>();
    }
  }

  return sourceFileMetadata;
}

async function canSkipChangedLogSource(options: GetSafeSourceFileMetadataOptions): Promise<boolean> {
  try {
    const currentSourceMetadata = await getSafeSourceFileMetadata(options);

    if (currentSourceMetadata.isNothing) {
      throw new Error(`Log source is no longer a regular file: ${options.sourceFilePath}`);
    }

    return true;
  } catch (error) {
    if (isMissingFileError(error)) {
      return true;
    }

    throw error;
  }
}

async function copyLogFileToSnapshot(options: CopyLogFileToSnapshotOptions): Promise<Maybe<LogSnapshotFile>> {
  const {copyFile, ensureDirectory, getFileMetadata, protectFile} = options;
  const sourceFileMetadata = await getSafeSourceFileMetadata({
    getFileMetadata,
    ensureDirectory,
    logDirectory: options.logDirectory,
    sourceFilePath: options.sourceFilePath,
  }).catch(error => {
    if (isMissingFileError(error)) {
      throw createLogSourceChangedError(options.sourceFilePath, error);
    }

    throw error;
  });

  if (sourceFileMetadata.isJust === false) {
    return Maybe.nothing<LogSnapshotFile>();
  }

  if (sourceFileMetadata.value.isFile === false) {
    return Maybe.nothing<LogSnapshotFile>();
  }

  await ensureDirectory(options.snapshotDirectoryPath, path.dirname(options.snapshotFilePath));
  try {
    await protectFile(options.sourceFilePath);
  } catch (error) {
    if (
      isMissingFileError(error) ||
      (error instanceof Error && 'code' in error && error.code === logFileIdentityChangedErrorCode)
    ) {
      throw createLogSourceChangedError(options.sourceFilePath, error);
    }

    throw error;
  }
  await copyFile(options.sourceFilePath, options.snapshotFilePath);
  await protectFile(options.snapshotFilePath);

  return Maybe.just({
    absolutePath: options.snapshotFilePath,
    relativePath: getArchiveRelativePath(options.relativePath),
  });
}

async function removeSnapshotDirectoryAfterFailure(
  snapshotDirectoryPath: Maybe<string>,
  options: CreateLogSnapshotOptions,
): Promise<void> {
  const {removeDirectory} = options;

  if (snapshotDirectoryPath.isJust === false) {
    return;
  }

  try {
    await removeDirectory(snapshotDirectoryPath.value);
  } catch (error) {
    options.reportFailure(`Failed to remove temporary log snapshot "${snapshotDirectoryPath.value}"`, error);
  }
}

export async function createLogSnapshot(options: CreateLogSnapshotOptions): Promise<LogSnapshot> {
  const {copyFile, createTemporaryDirectory, ensureDirectory, getFileMetadata, protectFile} = options;
  let snapshotDirectoryPath: Maybe<string> = Maybe.nothing<string>();

  try {
    return await options.runMaintenance(async () => {
      await options.cleanup();

      const relativeLogFilePaths = options.discoverLogFilePaths();
      const createdSnapshotDirectoryPath = await createTemporaryDirectory(options.temporaryDirectoryPrefix);
      snapshotDirectoryPath = Maybe.just(createdSnapshotDirectoryPath);
      const snapshotFiles: LogSnapshotFile[] = [];

      for (const relativePath of relativeLogFilePaths) {
        const sourceFilePath = resolvePathWithinDirectory({directoryPath: options.logDirectory, relativePath});
        const snapshotFilePath = resolvePathWithinDirectory({
          directoryPath: createdSnapshotDirectoryPath,
          relativePath,
        });

        const snapshotFile = await copyLogFileToSnapshot({
          copyFile,
          ensureDirectory,
          getFileMetadata,
          logDirectory: options.logDirectory,
          protectFile,
          relativePath,
          snapshotDirectoryPath: createdSnapshotDirectoryPath,
          sourceFilePath,
          snapshotFilePath,
        }).catch(async error => {
          options.reportFailure(`Failed to copy log file "${relativePath}" to the temporary snapshot`, error);

          if (
            isLogSourceChangedError(error) &&
            (await canSkipChangedLogSource({
              ensureDirectory,
              getFileMetadata,
              logDirectory: options.logDirectory,
              sourceFilePath,
            }))
          ) {
            return Maybe.nothing<LogSnapshotFile>();
          }

          throw error;
        });

        if (snapshotFile.isJust) {
          snapshotFiles.push(snapshotFile.value);
        }
      }

      return {directoryPath: createdSnapshotDirectoryPath, files: snapshotFiles};
    });
  } catch (error) {
    await removeSnapshotDirectoryAfterFailure(snapshotDirectoryPath, options);
    throw error;
  }
}

type RemoveTemporaryArchiveDirectoryOptions = {
  temporaryDirectoryPath: Maybe<string>;
  message: string;
} & Pick<LogArchiveDependencies, 'removeDirectory' | 'reportFailure'>;

async function removeTemporaryArchiveDirectory(options: RemoveTemporaryArchiveDirectoryOptions): Promise<void> {
  if (options.temporaryDirectoryPath.isNothing) {
    return;
  }

  try {
    await options.removeDirectory(options.temporaryDirectoryPath.value);
  } catch (error) {
    if (isMissingFileError(error)) {
      return;
    }

    options.reportFailure(options.message, error);
  }
}

async function waitForArchiveFailure(archive: ZipArchive): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    archive.once('error', reject);
    archive.once('warning', reject);
  });
}

async function waitForPromiseToSettle(promise: Promise<void>): Promise<void> {
  try {
    await promise;
  } catch (error) {
    noop(error);
  }
}

export async function streamLogFilesToZip(options: StreamLogFilesToZipOptions): Promise<void> {
  const {
    createArchive,
    createOutputStream,
    createTemporaryArchiveDirectory,
    commitArchive,
    removeDirectory,
    reportFailure,
  } = options;
  let outputStream: Maybe<Writable> = Maybe.nothing<Writable>();
  let archive: Maybe<ZipArchive> = Maybe.nothing<ZipArchive>();
  let outputCompletion: Maybe<Promise<void>> = Maybe.nothing<Promise<void>>();
  let temporaryDirectoryPath: Maybe<string> = Maybe.nothing<string>();

  try {
    const createdTemporaryDirectoryPath = await createTemporaryArchiveDirectory(options.destinationPath);
    temporaryDirectoryPath = Maybe.just(createdTemporaryDirectoryPath);
    const temporaryArchivePath = path.join(createdTemporaryDirectoryPath, 'logs.zip');
    const createdOutputStream = await createOutputStream(temporaryArchivePath);
    outputStream = Maybe.just(createdOutputStream);
    const createdOutputCompletion = finished(createdOutputStream);
    outputCompletion = Maybe.just(createdOutputCompletion);
    const createdArchive = createArchive();
    archive = Maybe.just(createdArchive);
    createdArchive.pipe(createdOutputStream);

    for (const snapshotFile of options.snapshotFiles) {
      createdArchive.file(snapshotFile.absolutePath, {name: snapshotFile.relativePath});
    }

    const archiveFailure = waitForArchiveFailure(createdArchive);
    const createdArchiveFinalization = createdArchive.finalize();
    await Promise.race([createdArchiveFinalization, archiveFailure, createdOutputCompletion]);
    await createdArchiveFinalization;
    await createdOutputCompletion;
    await commitArchive(temporaryArchivePath, options.destinationPath);
  } catch (error) {
    if (archive.isJust) {
      archive.value.abort();
    }

    if (outputStream.isJust) {
      outputStream.value.destroy(error instanceof Error ? error : new Error('Log archive output failed'));
    }

    if (outputCompletion.isJust) {
      await waitForPromiseToSettle(outputCompletion.value);
    }

    await removeTemporaryArchiveDirectory({
      temporaryDirectoryPath,
      message: 'Failed to remove incomplete log archive staging directory.',
      removeDirectory,
      reportFailure,
    });

    throw error;
  }

  await removeTemporaryArchiveDirectory({
    temporaryDirectoryPath,
    message: 'Failed to remove log archive staging directory.',
    removeDirectory,
    reportFailure,
  });
}

export async function exportLogFiles(options: ExportLogFilesOptions): Promise<void> {
  const snapshot = await options.createSnapshot();

  try {
    await options.streamSnapshot({destinationPath: options.destinationPath, snapshotFiles: snapshot.files});
  } finally {
    try {
      await options.removeSnapshotDirectory(snapshot.directoryPath);
    } catch (error) {
      options.reportFailure(`Failed to remove temporary log snapshot "${snapshot.directoryPath}"`, error);
    }
  }
}

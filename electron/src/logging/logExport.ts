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

export type LogSnapshotFile = {
  absolutePath: string;
  relativePath: string;
};

export type LogSnapshot = {
  directoryPath: string;
  files: readonly LogSnapshotFile[];
};

export type LogSnapshotFileMetadata = {
  isFile: boolean;
  isSymbolicLink: boolean;
};

export type LogSnapshotFileSystemDependencies = {
  copyFile: (sourceFilePath: string, destinationFilePath: string) => Promise<void>;
  createTemporaryDirectory: (temporaryDirectoryPrefix: string) => Promise<string>;
  ensureDirectory: (directoryPath: string) => Promise<void>;
  getFileMetadata: (filePath: string) => Promise<LogSnapshotFileMetadata>;
  removeDirectory: (directoryPath: string) => Promise<void>;
};

export type CreateLogSnapshotOptions = {
  cleanup: () => Promise<void>;
  discoverLogFilePaths: () => readonly string[];
  logDirectory: string;
  reportFailure: (message: string, error: unknown) => void;
  runMaintenance<Result>(operation: () => Promise<Result>): Promise<Result>;
  temporaryDirectoryPrefix: string;
  dependencies: LogSnapshotFileSystemDependencies;
};

export type StreamLogFilesToZipOptions = {
  destinationPath: string;
  snapshotFiles: readonly LogSnapshotFile[];
  dependencies: LogArchiveDependencies;
};

export type LogArchiveDependencies = {
  createArchive: () => ZipArchive;
  createOutputStream: (destinationPath: string) => Writable;
  pathExists: (filePath: string) => Promise<boolean>;
  removeFile: (filePath: string) => Promise<void>;
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
  sourceFilePath: string;
  snapshotFilePath: string;
  dependencies: LogSnapshotFileSystemDependencies;
};

type GetSafeSourceFileMetadataOptions = {
  logDirectory: string;
  sourceFilePath: string;
  dependencies: LogSnapshotFileSystemDependencies;
};

type RemoveIncompleteDestinationFileOptions = {
  destinationPath: string;
  destinationAlreadyExisted: boolean;
  outputStreamCreated: boolean;
  exportOptions: StreamLogFilesToZipOptions;
};

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
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
  const resolvedLogDirectory = path.resolve(options.logDirectory);
  const sourceRelativePath = path.relative(resolvedLogDirectory, options.sourceFilePath);
  let currentPath = resolvedLogDirectory;
  let sourceFileMetadata: Maybe<LogSnapshotFileMetadata> = Maybe.nothing<LogSnapshotFileMetadata>();

  for (const pathPart of sourceRelativePath.split(path.sep)) {
    currentPath = path.join(currentPath, pathPart);
    const currentFileMetadata = await options.dependencies.getFileMetadata(currentPath);
    sourceFileMetadata = Maybe.just(currentFileMetadata);

    if (currentFileMetadata.isSymbolicLink === true) {
      return Maybe.nothing<LogSnapshotFileMetadata>();
    }
  }

  return sourceFileMetadata;
}

async function copyLogFileToSnapshot(options: CopyLogFileToSnapshotOptions): Promise<Maybe<LogSnapshotFile>> {
  const sourceFileMetadata = await getSafeSourceFileMetadata({
    dependencies: options.dependencies,
    logDirectory: options.logDirectory,
    sourceFilePath: options.sourceFilePath,
  });

  if (sourceFileMetadata.isJust === false) {
    return Maybe.nothing<LogSnapshotFile>();
  }

  if (sourceFileMetadata.value.isFile === false) {
    return Maybe.nothing<LogSnapshotFile>();
  }

  await options.dependencies.ensureDirectory(path.dirname(options.snapshotFilePath));
  await options.dependencies.copyFile(options.sourceFilePath, options.snapshotFilePath);

  return Maybe.just({
    absolutePath: options.snapshotFilePath,
    relativePath: getArchiveRelativePath(options.relativePath),
  });
}

async function removeSnapshotDirectoryAfterFailure(
  snapshotDirectoryPath: Maybe<string>,
  options: CreateLogSnapshotOptions,
): Promise<void> {
  if (snapshotDirectoryPath.isJust === false) {
    return;
  }

  try {
    await options.dependencies.removeDirectory(snapshotDirectoryPath.value);
  } catch (error) {
    options.reportFailure(`Failed to remove temporary log snapshot "${snapshotDirectoryPath.value}"`, error);
  }
}

export async function createLogSnapshot(options: CreateLogSnapshotOptions): Promise<LogSnapshot> {
  let snapshotDirectoryPath: Maybe<string> = Maybe.nothing<string>();

  try {
    return await options.runMaintenance(async () => {
      await options.cleanup();

      const relativeLogFilePaths = options.discoverLogFilePaths();
      const createdSnapshotDirectoryPath = await options.dependencies.createTemporaryDirectory(
        options.temporaryDirectoryPrefix,
      );
      snapshotDirectoryPath = Maybe.just(createdSnapshotDirectoryPath);
      const snapshotFiles: LogSnapshotFile[] = [];

      for (const relativePath of relativeLogFilePaths) {
        const sourceFilePath = resolvePathWithinDirectory({directoryPath: options.logDirectory, relativePath});
        const snapshotFilePath = resolvePathWithinDirectory({
          directoryPath: createdSnapshotDirectoryPath,
          relativePath,
        });

        const snapshotFile = await copyLogFileToSnapshot({
          dependencies: options.dependencies,
          logDirectory: options.logDirectory,
          relativePath,
          sourceFilePath,
          snapshotFilePath,
        }).catch(error => {
          options.reportFailure(`Failed to copy log file "${relativePath}" to the temporary snapshot`, error);

          return Maybe.nothing<LogSnapshotFile>();
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

async function removeIncompleteDestinationFile(options: RemoveIncompleteDestinationFileOptions): Promise<void> {
  if (options.destinationAlreadyExisted || options.outputStreamCreated === false) {
    return;
  }

  try {
    await options.exportOptions.dependencies.removeFile(options.destinationPath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return;
    }

    options.exportOptions.dependencies.reportFailure(
      `Failed to remove incomplete log archive "${options.destinationPath}"`,
      error,
    );
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
  const destinationAlreadyExisted = await options.dependencies.pathExists(options.destinationPath);
  let outputStream: Maybe<Writable> = Maybe.nothing<Writable>();
  let outputStreamCreated = false;
  let archive: Maybe<ZipArchive> = Maybe.nothing<ZipArchive>();
  let outputCompletion: Maybe<Promise<void>> = Maybe.nothing<Promise<void>>();

  try {
    const createdOutputStream = options.dependencies.createOutputStream(options.destinationPath);
    outputStream = Maybe.just(createdOutputStream);
    outputStreamCreated = true;
    const createdOutputCompletion = finished(createdOutputStream);
    outputCompletion = Maybe.just(createdOutputCompletion);
    const createdArchive = options.dependencies.createArchive();
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

    await removeIncompleteDestinationFile({
      destinationPath: options.destinationPath,
      destinationAlreadyExisted,
      outputStreamCreated,
      exportOptions: options,
    });

    throw error;
  }
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

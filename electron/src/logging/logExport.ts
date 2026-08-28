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

import {ZipArchive} from 'archiver';
import * as fs from 'fs-extra';
import noop from 'lodash/noop';
import {Maybe} from 'true-myth';

import * as os from 'os';
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

export type CreateLogSnapshotParameters = {
  cleanup: () => Promise<void>;
  discoverLogFilePaths: () => readonly string[];
  logDirectory: string;
  reportFailure: (message: string, error: unknown) => void;
  runMaintenance<Result>(operation: () => Promise<Result>): Promise<Result>;
  dependencies: LogSnapshotFileSystemDependencies;
};

export type StreamLogFilesToZipParameters = {
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

export type StreamSnapshotParameters = {
  destinationPath: string;
  snapshotFiles: readonly LogSnapshotFile[];
};

export type ExportLogFilesParameters = {
  createSnapshot: () => Promise<LogSnapshot>;
  destinationPath: string;
  removeSnapshotDirectory: (directoryPath: string) => Promise<void>;
  reportFailure: (message: string, error: unknown) => void;
  streamSnapshot: (parameters: StreamSnapshotParameters) => Promise<void>;
};

type ResolvePathWithinDirectoryParameters = {
  directoryPath: string;
  relativePath: string;
};

type CopyLogFileToSnapshotParameters = {
  logDirectory: string;
  relativePath: string;
  sourceFilePath: string;
  snapshotFilePath: string;
  dependencies: LogSnapshotFileSystemDependencies;
};

type GetSafeSourceFileMetadataParameters = {
  logDirectory: string;
  sourceFilePath: string;
  dependencies: LogSnapshotFileSystemDependencies;
};

type RemoveIncompleteDestinationFileParameters = {
  destinationPath: string;
  destinationAlreadyExisted: boolean;
  outputStreamCreated: boolean;
  exportParameters: StreamLogFilesToZipParameters;
};

const logSnapshotDirectoryPrefix = path.join(os.tmpdir(), 'wire-log-snapshot-');

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export function resolvePathWithinDirectory(parameters: ResolvePathWithinDirectoryParameters): string {
  const resolvedDirectoryPath = path.resolve(parameters.directoryPath);

  if (parameters.relativePath.length === 0 || path.isAbsolute(parameters.relativePath)) {
    throw new Error(`Log path must be a non-empty relative path: ${parameters.relativePath}`);
  }

  const resolvedPath = path.resolve(resolvedDirectoryPath, parameters.relativePath);
  const relativeResolvedPath = path.relative(resolvedDirectoryPath, resolvedPath);
  const isOutsideDirectory =
    relativeResolvedPath === '' ||
    relativeResolvedPath === '..' ||
    relativeResolvedPath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeResolvedPath);

  if (isOutsideDirectory) {
    throw new Error(`Log path escapes its directory: ${parameters.relativePath}`);
  }

  return resolvedPath;
}

function getArchiveRelativePath(relativePath: string): string {
  return path.normalize(relativePath).split(path.sep).join('/');
}

async function getSafeSourceFileMetadata(
  parameters: GetSafeSourceFileMetadataParameters,
): Promise<Maybe<LogSnapshotFileMetadata>> {
  const resolvedLogDirectory = path.resolve(parameters.logDirectory);
  const sourceRelativePath = path.relative(resolvedLogDirectory, parameters.sourceFilePath);
  let currentPath = resolvedLogDirectory;
  let sourceFileMetadata: Maybe<LogSnapshotFileMetadata> = Maybe.nothing<LogSnapshotFileMetadata>();

  for (const pathPart of sourceRelativePath.split(path.sep)) {
    currentPath = path.join(currentPath, pathPart);
    const currentFileMetadata = await parameters.dependencies.getFileMetadata(currentPath);
    sourceFileMetadata = Maybe.just(currentFileMetadata);

    if (currentFileMetadata.isSymbolicLink === true) {
      return Maybe.nothing<LogSnapshotFileMetadata>();
    }
  }

  return sourceFileMetadata;
}

async function copyLogFileToSnapshot(parameters: CopyLogFileToSnapshotParameters): Promise<Maybe<LogSnapshotFile>> {
  const sourceFileMetadata = await getSafeSourceFileMetadata({
    dependencies: parameters.dependencies,
    logDirectory: parameters.logDirectory,
    sourceFilePath: parameters.sourceFilePath,
  });

  if (sourceFileMetadata.isJust === false) {
    return Maybe.nothing<LogSnapshotFile>();
  }

  if (sourceFileMetadata.value.isFile === false) {
    return Maybe.nothing<LogSnapshotFile>();
  }

  await parameters.dependencies.ensureDirectory(path.dirname(parameters.snapshotFilePath));
  await parameters.dependencies.copyFile(parameters.sourceFilePath, parameters.snapshotFilePath);

  return Maybe.just({
    absolutePath: parameters.snapshotFilePath,
    relativePath: getArchiveRelativePath(parameters.relativePath),
  });
}

async function removeSnapshotDirectoryAfterFailure(
  snapshotDirectoryPath: Maybe<string>,
  parameters: CreateLogSnapshotParameters,
): Promise<void> {
  if (snapshotDirectoryPath.isJust === false) {
    return;
  }

  try {
    await parameters.dependencies.removeDirectory(snapshotDirectoryPath.value);
  } catch (error) {
    parameters.reportFailure(`Failed to remove temporary log snapshot "${snapshotDirectoryPath.value}"`, error);
  }
}

export async function createLogSnapshot(parameters: CreateLogSnapshotParameters): Promise<LogSnapshot> {
  let snapshotDirectoryPath: Maybe<string> = Maybe.nothing<string>();

  try {
    return await parameters.runMaintenance(async () => {
      await parameters.cleanup();

      const relativeLogFilePaths = parameters.discoverLogFilePaths();
      const createdSnapshotDirectoryPath = await parameters.dependencies.createTemporaryDirectory(
        logSnapshotDirectoryPrefix,
      );
      snapshotDirectoryPath = Maybe.just(createdSnapshotDirectoryPath);
      const snapshotFiles: LogSnapshotFile[] = [];

      for (const relativePath of relativeLogFilePaths) {
        const sourceFilePath = resolvePathWithinDirectory({directoryPath: parameters.logDirectory, relativePath});
        const snapshotFilePath = resolvePathWithinDirectory({
          directoryPath: createdSnapshotDirectoryPath,
          relativePath,
        });

        const snapshotFile = await copyLogFileToSnapshot({
          dependencies: parameters.dependencies,
          logDirectory: parameters.logDirectory,
          relativePath,
          sourceFilePath,
          snapshotFilePath,
        }).catch(error => {
          parameters.reportFailure(`Failed to copy log file "${relativePath}" to the temporary snapshot`, error);

          return Maybe.nothing<LogSnapshotFile>();
        });

        if (snapshotFile.isJust) {
          snapshotFiles.push(snapshotFile.value);
        }
      }

      return {directoryPath: createdSnapshotDirectoryPath, files: snapshotFiles};
    });
  } catch (error) {
    await removeSnapshotDirectoryAfterFailure(snapshotDirectoryPath, parameters);
    throw error;
  }
}

async function removeIncompleteDestinationFile(parameters: RemoveIncompleteDestinationFileParameters): Promise<void> {
  if (parameters.destinationAlreadyExisted || parameters.outputStreamCreated === false) {
    return;
  }

  try {
    await parameters.exportParameters.dependencies.removeFile(parameters.destinationPath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return;
    }

    parameters.exportParameters.dependencies.reportFailure(
      `Failed to remove incomplete log archive "${parameters.destinationPath}"`,
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

export async function streamLogFilesToZip(parameters: StreamLogFilesToZipParameters): Promise<void> {
  const destinationAlreadyExisted = await parameters.dependencies.pathExists(parameters.destinationPath);
  let outputStream: Maybe<Writable> = Maybe.nothing<Writable>();
  let outputStreamCreated = false;
  let archive: Maybe<ZipArchive> = Maybe.nothing<ZipArchive>();
  let archiveFinalization: Maybe<Promise<void>> = Maybe.nothing<Promise<void>>();
  let outputCompletion: Maybe<Promise<void>> = Maybe.nothing<Promise<void>>();

  try {
    const createdOutputStream = parameters.dependencies.createOutputStream(parameters.destinationPath);
    outputStream = Maybe.just(createdOutputStream);
    outputStreamCreated = true;
    const createdOutputCompletion = finished(createdOutputStream);
    outputCompletion = Maybe.just(createdOutputCompletion);
    void waitForPromiseToSettle(createdOutputCompletion);
    const createdArchive = parameters.dependencies.createArchive();
    archive = Maybe.just(createdArchive);
    createdArchive.pipe(createdOutputStream);

    for (const snapshotFile of parameters.snapshotFiles) {
      createdArchive.file(snapshotFile.absolutePath, {name: snapshotFile.relativePath});
    }

    const createdArchiveFinalization = createdArchive.finalize();
    archiveFinalization = Maybe.just(createdArchiveFinalization);
    await Promise.race([createdArchiveFinalization, waitForArchiveFailure(createdArchive)]);
    await createdOutputCompletion;
  } catch (error) {
    if (archive.isJust) {
      archive.value.abort();
    }

    if (outputStream.isJust) {
      outputStream.value.destroy(error instanceof Error ? error : new Error('Log archive output failed'));
    }

    if (archiveFinalization.isJust) {
      await waitForPromiseToSettle(archiveFinalization.value);
    }

    if (outputCompletion.isJust) {
      await waitForPromiseToSettle(outputCompletion.value);
    }

    await removeIncompleteDestinationFile({
      destinationPath: parameters.destinationPath,
      destinationAlreadyExisted,
      outputStreamCreated,
      exportParameters: parameters,
    });

    throw error;
  }
}

export async function exportLogFiles(parameters: ExportLogFilesParameters): Promise<void> {
  const snapshot = await parameters.createSnapshot();

  try {
    await parameters.streamSnapshot({destinationPath: parameters.destinationPath, snapshotFiles: snapshot.files});
  } finally {
    try {
      await parameters.removeSnapshotDirectory(snapshot.directoryPath);
    } catch (error) {
      parameters.reportFailure(`Failed to remove temporary log snapshot "${snapshot.directoryPath}"`, error);
    }
  }
}

export function createLogSnapshotFileSystemDependencies(): LogSnapshotFileSystemDependencies {
  return {
    async copyFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
      await fs.copyFile(sourceFilePath, destinationFilePath);
    },
    async createTemporaryDirectory(temporaryDirectoryPrefix: string): Promise<string> {
      return fs.mkdtemp(temporaryDirectoryPrefix);
    },
    async ensureDirectory(directoryPath: string): Promise<void> {
      await fs.ensureDir(directoryPath);
    },
    async getFileMetadata(filePath: string): Promise<LogSnapshotFileMetadata> {
      const fileStatistics = await fs.lstat(filePath);

      return {
        isFile: fileStatistics.isFile(),
        isSymbolicLink: fileStatistics.isSymbolicLink(),
      };
    },
    async removeDirectory(directoryPath: string): Promise<void> {
      await fs.remove(directoryPath);
    },
  };
}

export function createLogArchiveDependencies(
  reportFailure: (message: string, error: unknown) => void,
): LogArchiveDependencies {
  return {
    createArchive() {
      return new ZipArchive({zlib: {level: 6}});
    },
    createOutputStream(destinationPath: string) {
      return fs.createWriteStream(destinationPath);
    },
    pathExists(filePath: string) {
      return fs.pathExists(filePath);
    },
    removeFile(filePath: string) {
      return fs.unlink(filePath);
    },
    reportFailure,
  };
}

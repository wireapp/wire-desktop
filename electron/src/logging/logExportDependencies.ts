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

import * as path from 'path';
import {pipeline} from 'stream/promises';

import {logSourceChangedErrorCode} from './logExport';
import type {LogArchiveDependencies, LogSnapshotFileSystemDependencies} from './logExport';
import {ensurePrivateLogDirectory, protectPrivateDirectoryAtPathSync} from './logPermissions';

const privateFileMode = 0o600;

type CopyPrivateLogFileParameters = {
  destinationFilePath: string;
  openSourceFile: (sourceFilePath: string, flags: number) => Promise<fs.promises.FileHandle>;
  sourceFilePath: string;
};

export type LogSnapshotFileSystemDependenciesOptions = {
  openSourceFile?: (sourceFilePath: string, flags: number) => Promise<fs.promises.FileHandle>;
};

function getNoFollowFlag(): number {
  return process.platform === 'win32' ? 0 : fs.constants.O_NOFOLLOW ?? 0;
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function createLogSourceChangedError(sourceFilePath: string, cause: unknown): Error {
  const error = new Error(`Log source changed while being copied: ${sourceFilePath}`);

  Object.assign(error, {cause, code: logSourceChangedErrorCode});

  return error;
}

function assertOwnedByCurrentUser(fileMetadata: fs.Stats, filePath: string): void {
  if (process.platform !== 'win32' && fileMetadata.uid !== process.getuid?.()) {
    throw new Error(`Log export path is not owned by the current user: ${filePath}`);
  }
}

function assertRegularSingleLinkFile(fileMetadata: fs.Stats, filePath: string): void {
  if (!fileMetadata.isFile() || fileMetadata.nlink > 1) {
    throw new Error(`Log export path is not a single-link regular file: ${filePath}`);
  }

  assertOwnedByCurrentUser(fileMetadata, filePath);
}

async function copyPrivateLogFile(options: CopyPrivateLogFileParameters): Promise<void> {
  const {destinationFilePath, openSourceFile, sourceFilePath} = options;
  const sourcePathMetadata = await fs.promises.lstat(sourceFilePath).catch(error => {
    if (isMissingPathError(error)) {
      throw createLogSourceChangedError(sourceFilePath, error);
    }

    throw error;
  });

  if (sourcePathMetadata.isSymbolicLink()) {
    throw new Error(`Log source file is a symbolic link: ${sourceFilePath}`);
  }

  assertRegularSingleLinkFile(sourcePathMetadata, sourceFilePath);

  const sourceFileHandle = await openSourceFile(sourceFilePath, fs.constants.O_RDONLY | getNoFollowFlag()).catch(
    error => {
      if (isMissingPathError(error)) {
        throw createLogSourceChangedError(sourceFilePath, error);
      }

      throw error;
    },
  );
  let destinationFileHandle: fs.promises.FileHandle | undefined;

  try {
    const sourceFileMetadata = await sourceFileHandle.stat();
    assertRegularSingleLinkFile(sourceFileMetadata, sourceFilePath);

    if (sourcePathMetadata.dev !== sourceFileMetadata.dev || sourcePathMetadata.ino !== sourceFileMetadata.ino) {
      const error = new Error(`Log source file changed while being copied: ${sourceFilePath}`);

      Object.assign(error, {code: logSourceChangedErrorCode});

      throw error;
    }

    const destinationFlags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | getNoFollowFlag();
    destinationFileHandle = await fs.promises.open(destinationFilePath, destinationFlags, privateFileMode);
    const destinationFileMetadata = await destinationFileHandle.stat();
    assertRegularSingleLinkFile(destinationFileMetadata, destinationFilePath);

    if (process.platform !== 'win32') {
      if ((sourceFileMetadata.mode & 0o777) !== privateFileMode) {
        await sourceFileHandle.chmod(privateFileMode);
      }

      if ((destinationFileMetadata.mode & 0o777) !== privateFileMode) {
        await destinationFileHandle.chmod(privateFileMode);
      }
    }

    await pipeline(sourceFileHandle.createReadStream(), destinationFileHandle.createWriteStream());
  } catch (error) {
    if (destinationFileHandle !== undefined) {
      await destinationFileHandle.close();
      destinationFileHandle = undefined;
      await fs.promises.unlink(destinationFilePath).catch(() => undefined);
    }

    throw error;
  } finally {
    await sourceFileHandle.close();
    await destinationFileHandle?.close();
  }
}

async function validateArchiveDestination(destinationPath: string): Promise<void> {
  const destinationMetadata = await fs.promises.lstat(destinationPath).catch(error => {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  });

  if (destinationMetadata === undefined) {
    return;
  }

  if (destinationMetadata.isSymbolicLink() || !destinationMetadata.isFile()) {
    throw new Error(`Debug log archive destination is not a regular file: ${destinationPath}`);
  }

  assertOwnedByCurrentUser(destinationMetadata, destinationPath);

  const destinationFileHandle = await fs.promises.open(destinationPath, fs.constants.O_WRONLY | getNoFollowFlag());

  try {
    const openedDestinationMetadata = await destinationFileHandle.stat();

    if (
      !openedDestinationMetadata.isFile() ||
      destinationMetadata.dev !== openedDestinationMetadata.dev ||
      destinationMetadata.ino !== openedDestinationMetadata.ino
    ) {
      throw new Error(`Debug log archive destination changed while being validated: ${destinationPath}`);
    }

    assertOwnedByCurrentUser(openedDestinationMetadata, destinationPath);
  } finally {
    await destinationFileHandle.close();
  }
}

export function createLogSnapshotFileSystemDependencies(
  options: LogSnapshotFileSystemDependenciesOptions = {},
): LogSnapshotFileSystemDependencies {
  const openSourceFile =
    options.openSourceFile ??
    ((sourceFilePath: string, flags: number) => {
      return fs.promises.open(sourceFilePath, flags);
    });

  return {
    async copyFile(sourceFilePath: string, destinationFilePath: string) {
      await copyPrivateLogFile({destinationFilePath, openSourceFile, sourceFilePath});
    },
    async createTemporaryDirectory(temporaryDirectoryPrefix: string) {
      const snapshotDirectoryPath = await fs.mkdtemp(temporaryDirectoryPrefix);

      try {
        protectPrivateDirectoryAtPathSync(snapshotDirectoryPath);
        return snapshotDirectoryPath;
      } catch (error) {
        await fs.remove(snapshotDirectoryPath);
        throw error;
      }
    },
    async ensureDirectory(rootDirectoryPath: string, directoryPath: string) {
      await ensurePrivateLogDirectory(rootDirectoryPath, directoryPath);
    },
    async getFileMetadata(filePath: string) {
      const fileStatistics = await fs.lstat(filePath);

      return {
        isDirectory: fileStatistics.isDirectory(),
        isFile: fileStatistics.isFile(),
        isSymbolicLink: fileStatistics.isSymbolicLink(),
        linkCount: fileStatistics.nlink,
        ownerId: fileStatistics.uid,
      };
    },
    async removeDirectory(directoryPath: string) {
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
      const fileDescriptor = fs.openSync(destinationPath, 'wx', privateFileMode);

      try {
        const fileMetadata = fs.fstatSync(fileDescriptor);
        assertRegularSingleLinkFile(fileMetadata, destinationPath);

        if (process.platform !== 'win32' && (fileMetadata.mode & 0o777) !== privateFileMode) {
          fs.fchmodSync(fileDescriptor, privateFileMode);
        }

        return fs.createWriteStream(destinationPath, {fd: fileDescriptor});
      } catch (error) {
        fs.closeSync(fileDescriptor);
        fs.unlinkSync(destinationPath);
        throw error;
      }
    },
    async createTemporaryArchiveDirectory(destinationPath: string) {
      await validateArchiveDestination(destinationPath);
      const archiveDirectoryPath = await fs.mkdtemp(path.join(path.dirname(destinationPath), '.wire-log-export-'));

      try {
        protectPrivateDirectoryAtPathSync(archiveDirectoryPath);
        return archiveDirectoryPath;
      } catch (error) {
        await fs.remove(archiveDirectoryPath);
        throw error;
      }
    },
    async commitArchive(sourcePath: string, destinationPath: string) {
      const archiveMetadata = await fs.promises.lstat(sourcePath);

      if (archiveMetadata.isSymbolicLink()) {
        throw new Error(`Generated debug log archive is a symbolic link: ${sourcePath}`);
      }

      assertRegularSingleLinkFile(archiveMetadata, sourcePath);

      if (process.platform !== 'win32' && (archiveMetadata.mode & 0o777) !== privateFileMode) {
        throw new Error(`Generated debug log archive does not have private permissions: ${sourcePath}`);
      }

      await validateArchiveDestination(destinationPath);
      await fs.promises.rename(sourcePath, destinationPath);
    },
    async removeDirectory(directoryPath: string) {
      await fs.remove(directoryPath);
    },
    reportFailure,
  };
}

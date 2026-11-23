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

import * as os from 'os';
import * as path from 'path';
import {pipeline} from 'stream/promises';

import type {
  LogArchiveDependencies,
  LogSnapshotFileSystemDependencies,
  PrivateZipStagingDependencies,
} from './logExport';

const privateDirectoryMode = 0o700;
const privateFileMode = 0o600;

function isPermissionError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error.code === 'EACCES' || error.code === 'EPERM');
}

async function copyPrivateLogFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
  const sourceFileHandle = await fs.promises.open(sourceFilePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);

  try {
    await pipeline(
      sourceFileHandle.createReadStream({autoClose: false}),
      fs.createWriteStream(destinationFilePath, {flags: 'wx', mode: privateFileMode}),
    );
  } finally {
    await sourceFileHandle.close();
  }
}

type LogArchiveFileSystemDependencies = LogArchiveDependencies & PrivateZipStagingDependencies;

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function getPathStatisticsIfPresent(filePath: string): Promise<fs.Stats | undefined> {
  try {
    return await fs.promises.lstat(filePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }

    throw error;
  }
}

export function createLogSnapshotFileSystemDependencies(): LogSnapshotFileSystemDependencies {
  return {
    async copyFile(sourceFilePath: string, destinationFilePath: string) {
      if (process.platform === 'win32') {
        await fs.copyFile(sourceFilePath, destinationFilePath);
        return;
      }

      await copyPrivateLogFile(sourceFilePath, destinationFilePath);
    },
    async createTemporaryDirectory(temporaryDirectoryPrefix: string) {
      return fs.mkdtemp(temporaryDirectoryPrefix);
    },
    async ensureDirectory(directoryPath: string) {
      if (process.platform === 'win32') {
        await fs.ensureDir(directoryPath);
        return;
      }

      await fs.promises.mkdir(directoryPath, {recursive: true, mode: privateDirectoryMode});
    },
    async getFileMetadata(filePath: string) {
      const fileStatistics = await fs.lstat(filePath);

      return {
        isFile: fileStatistics.isFile(),
        isSymbolicLink: fileStatistics.isSymbolicLink(),
      };
    },
    async removeDirectory(directoryPath: string) {
      await fs.remove(directoryPath);
    },
  };
}

export function createLogArchiveDependencies(
  reportFailure: (message: string, error: unknown) => void,
): LogArchiveFileSystemDependencies {
  return {
    createArchive() {
      return new ZipArchive({zlib: {level: 6}});
    },
    createOutputStream(destinationPath: string) {
      if (process.platform !== 'win32') {
        const fileDescriptor = fs.openSync(destinationPath, 'wx', privateFileMode);

        try {
          fs.fchmodSync(fileDescriptor, privateFileMode);
          return fs.createWriteStream(destinationPath, {fd: fileDescriptor});
        } catch (error) {
          fs.closeSync(fileDescriptor);
          try {
            fs.unlinkSync(destinationPath);
          } catch (cleanupError) {
            reportFailure(`Failed to remove incomplete log archive "${destinationPath}"`, cleanupError);
          }

          throw error;
        }
      }

      return fs.createWriteStream(destinationPath);
    },
    async createTemporaryArchiveDirectory(destinationPath: string) {
      const siblingTemporaryDirectoryPrefix = path.join(path.dirname(destinationPath), '.wire-log-export-');

      try {
        return await fs.mkdtemp(siblingTemporaryDirectoryPrefix);
      } catch (error) {
        if (isPermissionError(error) === false) {
          throw error;
        }

        return fs.mkdtemp(path.join(os.tmpdir(), '.wire-log-export-'));
      }
    },
    async publishStagedArchive(stagedArchivePath: string, destinationPath: string) {
      const destinationStatistics = await getPathStatisticsIfPresent(destinationPath);

      if (
        destinationStatistics !== undefined &&
        (destinationStatistics.isSymbolicLink() || !destinationStatistics.isFile())
      ) {
        throw new Error(`Debug log archive destination is not a regular file: ${destinationPath}`);
      }

      const stagingParentDirectoryPath = path.resolve(path.dirname(path.dirname(stagedArchivePath)));
      const destinationDirectoryPath = path.resolve(path.dirname(destinationPath));

      if (stagingParentDirectoryPath === destinationDirectoryPath) {
        if (destinationStatistics !== undefined) {
          await fs.promises.access(destinationPath, fs.constants.W_OK);
        }

        await fs.promises.rename(stagedArchivePath, destinationPath);
        return;
      }

      const destinationFlags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW;
      const destinationHandle = await fs.promises.open(destinationPath, destinationFlags, privateFileMode);
      const destinationWasCreated = destinationStatistics === undefined;
      let destinationStreamOwnsHandle = false;

      try {
        const openedDestinationStatistics = await destinationHandle.stat();

        if (openedDestinationStatistics.isFile() === false) {
          throw new Error(`Debug log archive destination is not a regular file: ${destinationPath}`);
        }

        await destinationHandle.chmod(privateFileMode);
        await destinationHandle.truncate(0);
        const destinationWriteStream = destinationHandle.createWriteStream();
        destinationStreamOwnsHandle = true;
        await pipeline(fs.createReadStream(stagedArchivePath), destinationWriteStream);
      } catch (error) {
        if (destinationStreamOwnsHandle === false) {
          await destinationHandle.close().catch(cleanupError => {
            reportFailure(`Failed to close incomplete log archive "${destinationPath}"`, cleanupError);
          });
        }

        if (destinationWasCreated) {
          try {
            await fs.unlink(destinationPath);
          } catch (cleanupError) {
            if (isMissingFileError(cleanupError) === false) {
              reportFailure(`Failed to remove incomplete log archive "${destinationPath}"`, cleanupError);
            }
          }
        }

        throw error;
      }
    },
    pathExists(filePath: string) {
      return fs.pathExists(filePath);
    },
    removeFile(filePath: string) {
      return fs.unlink(filePath);
    },
    async removeStagingDirectory(directoryPath: string) {
      await fs.remove(directoryPath);
    },
    reportFailure,
  };
}

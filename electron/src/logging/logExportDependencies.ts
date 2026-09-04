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

import type {LogArchiveDependencies, LogSnapshotFileSystemDependencies} from './logExport';

export function createLogSnapshotFileSystemDependencies(): LogSnapshotFileSystemDependencies {
  return {
    async copyFile(sourceFilePath: string, destinationFilePath: string) {
      await fs.copyFile(sourceFilePath, destinationFilePath);
    },
    async createTemporaryDirectory(temporaryDirectoryPrefix: string) {
      return fs.mkdtemp(temporaryDirectoryPrefix);
    },
    async ensureDirectory(directoryPath: string) {
      await fs.ensureDir(directoryPath);
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

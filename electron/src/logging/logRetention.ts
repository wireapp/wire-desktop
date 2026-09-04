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

export type LogFileMetadata = {
  filePath: string;
  fileSizeBytes: number;
  isSymbolicLink: boolean;
  modifiedTimeMilliseconds: number;
};

export type LogRetentionPolicy = {
  maximumAgeMilliseconds: number;
  maximumTotalSizeBytes: number;
};

export type LogRetentionPlanParameters = {
  activeFilePaths: ReadonlySet<string>;
  currentTimeMilliseconds: number;
  files: readonly LogFileMetadata[];
  policy: LogRetentionPolicy;
};

export type LogRetentionPlan = {
  filesToDelete: readonly string[];
};

type GetFilesToDeleteForSizeParameters = {
  activeFilePaths: ReadonlySet<string>;
  files: readonly LogFileMetadata[];
  maximumTotalSizeBytes: number;
};

function compareLogFileAge(firstFile: LogFileMetadata, secondFile: LogFileMetadata): number {
  const modificationTimeDifference = firstFile.modifiedTimeMilliseconds - secondFile.modifiedTimeMilliseconds;

  if (modificationTimeDifference !== 0) {
    return modificationTimeDifference;
  }

  return firstFile.filePath.localeCompare(secondFile.filePath);
}

function getDeletableFiles(parameters: LogRetentionPlanParameters): LogFileMetadata[] {
  return parameters.files.filter(file => {
    return file.isSymbolicLink === false && parameters.activeFilePaths.has(file.filePath) === false;
  });
}

function getExpiredFiles(parameters: LogRetentionPlanParameters): LogFileMetadata[] {
  const expirationTimeMilliseconds = parameters.currentTimeMilliseconds - parameters.policy.maximumAgeMilliseconds;

  return getDeletableFiles(parameters)
    .filter(file => {
      return file.modifiedTimeMilliseconds < expirationTimeMilliseconds;
    })
    .toSorted(compareLogFileAge);
}

function getRemainingFiles(
  files: readonly LogFileMetadata[],
  filesToDelete: readonly LogFileMetadata[],
): LogFileMetadata[] {
  const deletedFilePaths = new Set(
    filesToDelete.map(file => {
      return file.filePath;
    }),
  );

  return files.filter(file => {
    return deletedFilePaths.has(file.filePath) === false;
  });
}

function getTotalFileSizeBytes(files: readonly LogFileMetadata[]): number {
  const filesWithoutSymbolicLinks = files.filter(file => {
    return file.isSymbolicLink === false;
  });

  return filesWithoutSymbolicLinks.reduce((totalFileSizeBytes, file) => {
    return totalFileSizeBytes + file.fileSizeBytes;
  }, 0);
}

function getFilesToDeleteForSize(parameters: GetFilesToDeleteForSizeParameters): LogFileMetadata[] {
  const filesEligibleForSizeDeletion = parameters.files
    .filter(file => {
      return file.isSymbolicLink === false && parameters.activeFilePaths.has(file.filePath) === false;
    })
    .toSorted(compareLogFileAge);
  const filesToDelete: LogFileMetadata[] = [];
  let remainingFileSizeBytes = getTotalFileSizeBytes(parameters.files);

  for (const file of filesEligibleForSizeDeletion) {
    if (remainingFileSizeBytes <= parameters.maximumTotalSizeBytes) {
      break;
    }

    filesToDelete.push(file);
    remainingFileSizeBytes -= file.fileSizeBytes;
  }

  return filesToDelete;
}

export function planLogCleanup(parameters: LogRetentionPlanParameters): LogRetentionPlan {
  const expiredFiles = getExpiredFiles(parameters);
  const filesAfterExpiration = getRemainingFiles(parameters.files, expiredFiles);
  const sizeLimitedFiles = getFilesToDeleteForSize({
    activeFilePaths: parameters.activeFilePaths,
    files: filesAfterExpiration,
    maximumTotalSizeBytes: parameters.policy.maximumTotalSizeBytes,
  });

  return {
    filesToDelete: [...expiredFiles, ...sizeLimitedFiles].map(file => {
      return file.filePath;
    }),
  };
}

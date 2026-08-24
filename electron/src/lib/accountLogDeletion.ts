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

import * as path from 'path';

export type AccountLogDirectoryParameters = {
  accountId: string;
  filePaths: readonly string[];
  logDirectory: string;
};

export type AccountLogDeletionDependencies = {
  isSafeDirectory: (directoryPath: string) => Promise<boolean>;
  removeDirectory: (directoryPath: string) => Promise<void>;
  reportFailure: (message: string, error: unknown) => void;
};

export type DeleteAccountLogDirectoriesParameters = AccountLogDirectoryParameters & {
  dependencies: AccountLogDeletionDependencies;
};

function getRelativePathSegments(logDirectory: string, filePath: string): string[] {
  return path.relative(logDirectory, filePath).split(path.sep);
}

function isNewAccountLogPath(pathSegments: readonly string[], accountId: string): boolean {
  return pathSegments.length >= 4 && pathSegments[1] === 'accounts' && pathSegments[2] === accountId;
}

function isLegacyTimestampedAccountLogPath(pathSegments: readonly string[], accountId: string): boolean {
  if (pathSegments.length < 2) {
    return false;
  }

  const directoryName = pathSegments[pathSegments.length - 2];

  return directoryName.endsWith(`_${accountId}`);
}

export function getAccountLogDirectories(parameters: AccountLogDirectoryParameters): readonly string[] {
  const accountDirectories = new Set<string>([path.join(parameters.logDirectory, parameters.accountId)]);

  for (const filePath of parameters.filePaths) {
    const pathSegments = getRelativePathSegments(parameters.logDirectory, filePath);

    if (isNewAccountLogPath(pathSegments, parameters.accountId)) {
      accountDirectories.add(path.join(parameters.logDirectory, pathSegments[0], 'accounts', parameters.accountId));
    }

    if (isLegacyTimestampedAccountLogPath(pathSegments, parameters.accountId)) {
      accountDirectories.add(path.dirname(filePath));
    }
  }

  return [...accountDirectories].toSorted();
}

export async function deleteAccountLogDirectories(parameters: DeleteAccountLogDirectoriesParameters): Promise<void> {
  const accountDirectories = getAccountLogDirectories(parameters);

  for (const directoryPath of accountDirectories) {
    try {
      const isSafeDirectory = await parameters.dependencies.isSafeDirectory(directoryPath);

      if (isSafeDirectory) {
        await parameters.dependencies.removeDirectory(directoryPath);
      }
    } catch (error) {
      parameters.dependencies.reportFailure(`Failed to delete account log directory "${directoryPath}"`, error);
    }
  }
}

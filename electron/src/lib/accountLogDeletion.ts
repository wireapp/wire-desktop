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

import * as path from 'path';

import {ValidationUtil} from '@wireapp/commons';

import {LogDirectoryCleanupResult} from '../logging/logDirectoryCleanup';

export type AccountLogDirectoryParameters = {
  accountId: string;
  filePaths: readonly string[];
  logDirectory: string;
};

export type AccountLogDeletionDependencies = {
  isSafeDirectory: (directoryPath: string) => Promise<boolean>;
  removeEmptyDirectoryAncestors: (directoryPath: string) => Promise<LogDirectoryCleanupResult>;
  removeDirectory: (directoryPath: string) => Promise<void>;
  reportFailure: (message: string, error: unknown) => void;
};

export type DeleteAccountLogDirectoriesParameters = AccountLogDirectoryParameters & {
  dependencies: AccountLogDeletionDependencies;
};

export type LegacyAccountLogDirectory = {
  accountId: string;
  accountIndex: number;
};

const LEGACY_ACCOUNT_LOG_DIRECTORY_PATTERN =
  /^(\d+)_(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

function getRelativePathSegments(logDirectory: string, filePath: string): string[] {
  return path.relative(logDirectory, filePath).split(path.sep);
}

function isNewAccountLogPath(pathSegments: readonly string[], accountId: string): boolean {
  return pathSegments.length >= 4 && pathSegments[1] === 'accounts' && pathSegments[2] === accountId;
}

export function parseLegacyAccountLogDirectory(directoryName: string): Maybe<LegacyAccountLogDirectory> {
  const patternMatch = Maybe.of(LEGACY_ACCOUNT_LOG_DIRECTORY_PATTERN.exec(directoryName));

  if (patternMatch.isNothing) {
    return Maybe.nothing<LegacyAccountLogDirectory>();
  }

  const accountIndex = Number(patternMatch.value[1]);
  const accountId = patternMatch.value[8];

  if (Number.isSafeInteger(accountIndex) === false || ValidationUtil.isUUIDv4(accountId) === false) {
    return Maybe.nothing<LegacyAccountLogDirectory>();
  }

  return Maybe.just({accountId, accountIndex});
}

function isLegacyTimestampedAccountLogPath(pathSegments: readonly string[], accountId: string): boolean {
  if (pathSegments.length < 2) {
    return false;
  }

  const directoryName = pathSegments[pathSegments.length - 2];
  const parsedDirectory = parseLegacyAccountLogDirectory(directoryName);

  return parsedDirectory.isJust && parsedDirectory.value.accountId === accountId;
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
        const cleanupResult = await parameters.dependencies.removeEmptyDirectoryAncestors(directoryPath);

        if (cleanupResult.isErr) {
          parameters.dependencies.reportFailure(
            `Failed to delete account log directory "${directoryPath}"`,
            cleanupResult.error,
          );
        }
      }
    } catch (error) {
      parameters.dependencies.reportFailure(`Failed to delete account log directory "${directoryPath}"`, error);
    }
  }
}

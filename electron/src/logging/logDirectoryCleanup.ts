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

import {Result, Unit} from 'true-myth';

import {getLogDirectoryAncestors, GetLogDirectoryAncestorsParameters} from './logDirectoryAncestors';

export type LogDirectoryMetadata = {
  isDirectory: boolean;
  isSymbolicLink: boolean;
};

export type LogDirectoryCleanupResult = Result<Unit, unknown>;

export type LogDirectoryCleanupDependencies = {
  getDirectoryMetadata: (directoryPath: string) => Promise<LogDirectoryMetadata>;
  removeDirectory: (directoryPath: string) => Promise<void>;
};

export type RemoveEmptyLogDirectoryParameters = {
  dependencies: LogDirectoryCleanupDependencies;
  directoryPath: string;
};

export type RemoveEmptyLogDirectoryAncestorsParameters = GetLogDirectoryAncestorsParameters & {
  dependencies: LogDirectoryCleanupDependencies;
};

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function isNonEmptyDirectoryError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error.code === 'ENOTEMPTY' || error.code === 'EEXIST');
}

export async function removeEmptyLogDirectory(
  parameters: RemoveEmptyLogDirectoryParameters,
): Promise<LogDirectoryCleanupResult> {
  try {
    const directoryMetadata = await parameters.dependencies.getDirectoryMetadata(parameters.directoryPath);

    if (directoryMetadata.isSymbolicLink || directoryMetadata.isDirectory === false) {
      return Result.ok<Unit, unknown>();
    }

    await parameters.dependencies.removeDirectory(parameters.directoryPath);

    return Result.ok<Unit, unknown>();
  } catch (error) {
    if (isMissingPathError(error) || isNonEmptyDirectoryError(error)) {
      return Result.ok<Unit, unknown>();
    }

    return Result.err<Unit, unknown>(error);
  }
}

export async function removeEmptyLogDirectoryAncestors(
  parameters: RemoveEmptyLogDirectoryAncestorsParameters,
): Promise<LogDirectoryCleanupResult> {
  const ancestorDirectories = getLogDirectoryAncestors(parameters);

  for (const directoryPath of ancestorDirectories) {
    const cleanupResult = await removeEmptyLogDirectory({dependencies: parameters.dependencies, directoryPath});

    if (cleanupResult.isErr) {
      return cleanupResult;
    }
  }

  return Result.ok<Unit, unknown>();
}

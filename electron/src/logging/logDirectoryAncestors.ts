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

export type LogDirectoryPathType = 'directory' | 'file';

export type GetLogDirectoryAncestorsParameters = {
  logDirectory: string;
  pathToRemove: string;
  pathType: LogDirectoryPathType;
};

function isPathInsideLogDirectory(logDirectory: string, candidatePath: string): boolean {
  const relativePath = path.relative(logDirectory, candidatePath);

  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    relativePath.startsWith(`..${path.sep}`) === false &&
    path.isAbsolute(relativePath) === false
  );
}

function getStartingDirectory(parameters: GetLogDirectoryAncestorsParameters): string {
  const resolvedPath = path.resolve(parameters.pathToRemove);

  if (parameters.pathType === 'file') {
    return path.dirname(resolvedPath);
  }

  return resolvedPath;
}

export function getLogDirectoryAncestors(parameters: GetLogDirectoryAncestorsParameters): readonly string[] {
  const resolvedLogDirectory = path.resolve(parameters.logDirectory);
  let currentDirectory = getStartingDirectory(parameters);
  const ancestorDirectories: string[] = [];

  while (
    currentDirectory !== resolvedLogDirectory &&
    isPathInsideLogDirectory(resolvedLogDirectory, currentDirectory)
  ) {
    const relativeAncestorPath = path.relative(resolvedLogDirectory, currentDirectory);
    ancestorDirectories.push(path.join(parameters.logDirectory, relativeAncestorPath));
    currentDirectory = path.dirname(currentDirectory);
  }

  return ancestorDirectories;
}

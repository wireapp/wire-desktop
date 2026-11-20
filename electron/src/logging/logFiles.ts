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

import globby from 'globby';

import * as fs from 'fs';

export type LogFileDiscoveryOptions = {
  absolute: boolean;
  baseDirectory: string;
};

export function isLogRootPresentAndSafe(baseDirectory: string): boolean {
  const rootMetadata = fs.lstatSync(baseDirectory, {throwIfNoEntry: false});

  if (rootMetadata === undefined) {
    return false;
  }

  if (rootMetadata.isSymbolicLink() || !rootMetadata.isDirectory()) {
    throw new Error(`Desktop log root is not a real directory: ${baseDirectory}`);
  }

  if (process.platform !== 'win32' && rootMetadata.uid !== process.getuid?.()) {
    throw new Error(`Desktop log root is not owned by the current user: ${baseDirectory}`);
  }

  return true;
}

export function getLogFilenames(parameters: LogFileDiscoveryOptions): string[] {
  const {absolute, baseDirectory} = parameters;

  if (isLogRootPresentAndSafe(baseDirectory) === false) {
    return [];
  }

  return globby.sync('**/*.{jsonl,log,old}', {
    absolute,
    cwd: baseDirectory,
    followSymbolicLinks: false,
    onlyFiles: true,
  });
}

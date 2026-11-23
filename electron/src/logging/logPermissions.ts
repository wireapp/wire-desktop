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

import * as fs from 'fs';
import * as path from 'path';

const privateDirectoryMode = 0o700;
const privateFileMode = 0o600;

function isAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function getPathStatisticsIfPresent(filePath: string): Promise<fs.Stats | undefined> {
  try {
    return await fs.promises.lstat(filePath);
  } catch (error) {
    if (isMissingPathError(error)) {
      return undefined;
    }

    throw error;
  }
}

type ManagedLogPathType = 'directory' | 'file';

function protectLogPathSync(filePath: string, pathType: ManagedLogPathType): boolean {
  const pathStatistics = fs.lstatSync(filePath, {throwIfNoEntry: false});

  if (
    pathStatistics === undefined ||
    pathStatistics.isSymbolicLink() ||
    (pathType === 'directory' ? !pathStatistics.isDirectory() : !pathStatistics.isFile())
  ) {
    return false;
  }

  const privateMode = pathType === 'directory' ? privateDirectoryMode : privateFileMode;

  if ((pathStatistics.mode & 0o7777) !== privateMode) {
    const noFollowFlag = fs.constants.O_NOFOLLOW;
    const directoryFlag = pathType === 'directory' ? fs.constants.O_DIRECTORY : 0;
    const fileDescriptor = fs.openSync(filePath, fs.constants.O_RDONLY | directoryFlag | noFollowFlag);

    try {
      fs.fchmodSync(fileDescriptor, privateMode);
    } finally {
      fs.closeSync(fileDescriptor);
    }
  }

  return pathType === 'directory';
}

function protectLogTreeSync(directoryPath: string): void {
  let protectedDirectory = false;

  try {
    protectedDirectory = protectLogPathSync(directoryPath, 'directory');
  } catch {
    process.stderr.write(`Unable to protect Desktop log path ${directoryPath}.\n`);
  }

  if (protectedDirectory === false) {
    return;
  }

  let directoryEntries: fs.Dirent[];

  try {
    directoryEntries = fs.readdirSync(directoryPath, {withFileTypes: true});
  } catch {
    process.stderr.write(`Unable to inspect Desktop log directory ${directoryPath}.\n`);
    return;
  }

  for (const entry of directoryEntries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isSymbolicLink()) {
      continue;
    }

    try {
      if (entry.isDirectory()) {
        protectLogTreeSync(entryPath);
        continue;
      }

      if (entry.isFile() && ['.log', '.jsonl', '.old'].some(extension => entry.name.endsWith(extension))) {
        protectLogPathSync(entryPath, 'file');
      }
    } catch {
      process.stderr.write(`Unable to protect Desktop log path ${entryPath}.\n`);
    }
  }
}

export function protectLogDirectoryAtStartup(logDirectory: string): void {
  if (process.platform === 'win32') {
    return;
  }

  protectLogTreeSync(logDirectory);
}

async function ensurePrivateDirectory(directoryPath: string, createParents = false): Promise<void> {
  let pathStatistics = await getPathStatisticsIfPresent(directoryPath);

  if (pathStatistics === undefined) {
    try {
      await fs.promises.mkdir(directoryPath, {mode: privateDirectoryMode, recursive: createParents});
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }
    }

    pathStatistics = await fs.promises.lstat(directoryPath);
  }

  if (pathStatistics.isSymbolicLink() || !pathStatistics.isDirectory()) {
    throw new Error(`Desktop log directory is not a real directory: ${directoryPath}`);
  }

  if ((pathStatistics.mode & 0o7777) !== privateDirectoryMode) {
    const directoryHandle = await fs.promises.open(
      directoryPath,
      fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | fs.constants.O_NOFOLLOW,
    );

    try {
      await directoryHandle.chmod(privateDirectoryMode);
    } finally {
      await directoryHandle.close();
    }
  }
}

export async function ensurePrivateLogDirectory(logDirectory: string, directoryPath: string): Promise<void> {
  const resolvedLogDirectory = path.resolve(logDirectory);
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const relativeDirectoryPath = path.relative(resolvedLogDirectory, resolvedDirectoryPath);

  if (
    relativeDirectoryPath === '..' ||
    relativeDirectoryPath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeDirectoryPath)
  ) {
    throw new Error(`Desktop log directory is outside the log root: ${directoryPath}`);
  }

  await ensurePrivateDirectory(resolvedLogDirectory, true);

  let currentDirectoryPath = resolvedLogDirectory;

  for (const pathSegment of relativeDirectoryPath.split(path.sep).filter(Boolean)) {
    currentDirectoryPath = path.join(currentDirectoryPath, pathSegment);
    await ensurePrivateDirectory(currentDirectoryPath);
  }
}

export async function getPrivateLogFileSize(filePath: string): Promise<number> {
  const pathStatistics = await fs.promises.lstat(filePath);

  if (pathStatistics.isSymbolicLink() || !pathStatistics.isFile()) {
    throw new Error(`Desktop log path is not a regular file: ${filePath}`);
  }

  if ((pathStatistics.mode & 0o7777) !== privateFileMode) {
    throw new Error(`Desktop log file does not have private permissions: ${filePath}`);
  }

  return pathStatistics.size;
}

export async function appendPrivateLogFile(filePath: string, content: string): Promise<void> {
  const appendFlags = fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW;
  const fileHandle = await fs.promises.open(filePath, appendFlags, privateFileMode);

  try {
    const openedFileStatistics = await fileHandle.stat();

    if (!openedFileStatistics.isFile()) {
      throw new Error(`Desktop log path is not a regular file: ${filePath}`);
    }

    if ((openedFileStatistics.mode & 0o7777) !== privateFileMode) {
      await fileHandle.chmod(privateFileMode);
    }

    await fileHandle.writeFile(content);
  } finally {
    await fileHandle.close();
  }
}

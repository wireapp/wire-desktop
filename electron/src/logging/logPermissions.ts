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
export const logFileIdentityChangedErrorCode = 'ERR_WIRE_LOG_FILE_IDENTITY_CHANGED';

type OpenLogFile = (filePath: string, flags: number, mode?: number) => Promise<fs.promises.FileHandle>;

// Windows mode bits do not set DACLs; Windows protection depends on inherited ACLs from the profile and export destination parents.

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function isAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}

function getDirectoryOpenFlags(): number {
  return fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY ?? 0) | (fs.constants.O_NOFOLLOW ?? 0);
}

function getFileReadOpenFlags(): number {
  return fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
}

function hasSameFileIdentity(first: fs.Stats, second: fs.Stats): boolean {
  return first.dev === second.dev && first.ino === second.ino;
}

function assertOwnedByCurrentUser(metadata: fs.Stats, filePath: string): void {
  if (process.platform !== 'win32' && metadata.uid !== process.getuid?.()) {
    throw new Error(`Log path is not owned by the current user: ${filePath}`);
  }
}

function assertSingleLinkFile(metadata: fs.Stats, filePath: string): void {
  if (metadata.nlink > 1) {
    throw new Error(`Log file has multiple hard links: ${filePath}`);
  }
}

function hasPrivateMode(metadata: fs.Stats, mode: number): boolean {
  return (metadata.mode & 0o777) === mode;
}

export function createLogFileIdentityChangedError(filePath: string): Error {
  const error = new Error(`Log file identity changed while it was being accessed: ${filePath}`);

  Object.assign(error, {code: logFileIdentityChangedErrorCode});

  return error;
}

function isManagedLogFile(filePath: string): boolean {
  return ['.log', '.jsonl', '.old'].some(extension => filePath.endsWith(extension));
}

function protectDirectorySync(directoryPath: string): void {
  const pathMetadata = fs.lstatSync(directoryPath);

  if (pathMetadata.isSymbolicLink() || !pathMetadata.isDirectory()) {
    throw new Error(`Log directory has an unexpected filesystem type: ${directoryPath}`);
  }

  assertOwnedByCurrentUser(pathMetadata, directoryPath);

  const directoryDescriptor = fs.openSync(directoryPath, getDirectoryOpenFlags());

  try {
    const openedDirectoryMetadata = fs.fstatSync(directoryDescriptor);

    if (!openedDirectoryMetadata.isDirectory() || !hasSameFileIdentity(pathMetadata, openedDirectoryMetadata)) {
      throw new Error(`Log directory changed while its permissions were being protected: ${directoryPath}`);
    }

    assertOwnedByCurrentUser(openedDirectoryMetadata, directoryPath);

    if (!hasPrivateMode(openedDirectoryMetadata, privateDirectoryMode)) {
      fs.fchmodSync(directoryDescriptor, privateDirectoryMode);
    }
  } finally {
    fs.closeSync(directoryDescriptor);
  }
}

export function protectPrivateDirectoryAtPathSync(directoryPath: string): void {
  if (process.platform !== 'win32') {
    protectDirectorySync(directoryPath);

    return;
  }

  const directoryMetadata = fs.lstatSync(directoryPath);

  if (directoryMetadata.isSymbolicLink() || !directoryMetadata.isDirectory()) {
    throw new Error(`Log directory has an unexpected filesystem type: ${directoryPath}`);
  }
}

function protectFileSync(filePath: string): void {
  const pathMetadata = fs.lstatSync(filePath);

  if (pathMetadata.isSymbolicLink() || !pathMetadata.isFile()) {
    return;
  }

  assertOwnedByCurrentUser(pathMetadata, filePath);
  assertSingleLinkFile(pathMetadata, filePath);

  const fileDescriptor = fs.openSync(filePath, getFileReadOpenFlags());

  try {
    const openedFileMetadata = fs.fstatSync(fileDescriptor);

    if (!openedFileMetadata.isFile() || !hasSameFileIdentity(pathMetadata, openedFileMetadata)) {
      throw new Error(`Log file changed while its permissions were being protected: ${filePath}`);
    }

    assertOwnedByCurrentUser(openedFileMetadata, filePath);
    assertSingleLinkFile(openedFileMetadata, filePath);

    if (!hasPrivateMode(openedFileMetadata, privateFileMode)) {
      fs.fchmodSync(fileDescriptor, privateFileMode);
    }
  } finally {
    fs.closeSync(fileDescriptor);
  }
}

export async function protectPrivateFile(
  filePath: string,
  openLogFile: OpenLogFile = (filePath, flags) => fs.promises.open(filePath, flags),
): Promise<void> {
  const pathMetadata = await fs.promises.lstat(filePath);

  if (pathMetadata.isSymbolicLink() || !pathMetadata.isFile()) {
    throw new Error(`Log file has an unexpected filesystem type: ${filePath}`);
  }

  assertOwnedByCurrentUser(pathMetadata, filePath);
  assertSingleLinkFile(pathMetadata, filePath);

  if (process.platform === 'win32') {
    return;
  }

  const fileHandle = await openLogFile(filePath, getFileReadOpenFlags());

  try {
    const openedFileMetadata = await fileHandle.stat();

    if (!openedFileMetadata.isFile()) {
      throw new Error(`Log file has an unexpected filesystem type: ${filePath}`);
    }

    assertOwnedByCurrentUser(openedFileMetadata, filePath);
    assertSingleLinkFile(openedFileMetadata, filePath);

    if (!hasSameFileIdentity(pathMetadata, openedFileMetadata)) {
      throw createLogFileIdentityChangedError(filePath);
    }

    if (!hasPrivateMode(openedFileMetadata, privateFileMode)) {
      await fileHandle.chmod(privateFileMode);
    }
  } finally {
    await fileHandle.close();
  }
}

function protectDirectoryTreeSync(directoryPath: string): void {
  protectDirectorySync(directoryPath);

  for (const directoryEntry of fs.readdirSync(directoryPath, {withFileTypes: true})) {
    const childPath = path.join(directoryPath, directoryEntry.name);

    if (directoryEntry.isSymbolicLink()) {
      continue;
    }

    if (directoryEntry.isDirectory()) {
      protectDirectoryTreeSync(childPath);

      continue;
    }

    if (directoryEntry.isFile() && isManagedLogFile(childPath)) {
      protectFileSync(childPath);
    }
  }
}

/**
 * Protects existing retained logs before importing the main-process logger.
 * @param {string} logDirectory Desktop-owned log root.
 * @returns {void}
 */
export function protectLogDirectoryAtStartup(logDirectory: string): void {
  if (process.platform === 'win32') {
    try {
      fs.mkdirSync(logDirectory, {mode: privateDirectoryMode});
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }
    }

    return;
  }

  try {
    fs.mkdirSync(logDirectory, {mode: privateDirectoryMode});
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  protectDirectoryTreeSync(logDirectory);
}

async function protectDirectory(directoryPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(directoryPath, {mode: privateDirectoryMode});
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  if (process.platform === 'win32') {
    const directoryMetadata = await fs.promises.lstat(directoryPath);
    if (directoryMetadata.isSymbolicLink() || !directoryMetadata.isDirectory()) {
      throw new Error(`Log directory has an unexpected filesystem type: ${directoryPath}`);
    }

    return;
  }

  const pathMetadata = await fs.promises.lstat(directoryPath);

  if (pathMetadata.isSymbolicLink() || !pathMetadata.isDirectory()) {
    throw new Error(`Log directory has an unexpected filesystem type: ${directoryPath}`);
  }

  assertOwnedByCurrentUser(pathMetadata, directoryPath);

  const directoryHandle = await fs.promises.open(directoryPath, getDirectoryOpenFlags());

  try {
    const openedDirectoryMetadata = await directoryHandle.stat();

    if (!openedDirectoryMetadata.isDirectory() || !hasSameFileIdentity(pathMetadata, openedDirectoryMetadata)) {
      throw new Error(`Log directory changed while its permissions were being protected: ${directoryPath}`);
    }

    assertOwnedByCurrentUser(openedDirectoryMetadata, directoryPath);

    if (!hasPrivateMode(openedDirectoryMetadata, privateDirectoryMode)) {
      await directoryHandle.chmod(privateDirectoryMode);
    }
  } finally {
    await directoryHandle.close();
  }
}

/**
 * Creates private descendants below the Desktop-owned log root.
 * @param {string} logDirectory Desktop-owned log root.
 * @param {string} directoryPath Directory to create or protect.
 * @returns {Promise<void>} Resolves after the directory tree is private.
 */
export async function ensurePrivateLogDirectory(logDirectory: string, directoryPath: string): Promise<void> {
  const resolvedLogDirectory = path.resolve(logDirectory);
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const relativeDirectoryPath = path.relative(resolvedLogDirectory, resolvedDirectoryPath);

  if (
    relativeDirectoryPath === '..' ||
    relativeDirectoryPath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeDirectoryPath)
  ) {
    throw new Error(`Log directory is outside the Desktop log root: ${directoryPath}`);
  }

  await protectDirectory(resolvedLogDirectory);

  let currentDirectoryPath = resolvedLogDirectory;

  for (const pathSegment of relativeDirectoryPath.split(path.sep).filter(Boolean)) {
    currentDirectoryPath = path.join(currentDirectoryPath, pathSegment);
    await protectDirectory(currentDirectoryPath);
  }
}

/**
 * Creates or reopens a Desktop log without following a symbolic link.
 * @param {string} filePath Desktop-owned log file path.
 * @param {string} content Text to append.
 * @param {OpenLogFile} openLogFile Filesystem open operation used for the append.
 * @returns {Promise<void>} Resolves after the log entry is appended.
 */
export async function appendPrivateLogFile(
  filePath: string,
  content: string,
  openLogFile: OpenLogFile = (filePath, flags, mode) => fs.promises.open(filePath, flags, mode),
): Promise<void> {
  const pathMetadata = await fs.promises.lstat(filePath).catch(error => {
    if (isMissingPathError(error)) {
      return undefined;
    }

    throw error;
  });

  if (pathMetadata?.isSymbolicLink() === true || (pathMetadata !== undefined && !pathMetadata.isFile())) {
    throw new Error(`Log file has an unexpected filesystem type: ${filePath}`);
  }

  if (pathMetadata !== undefined) {
    assertOwnedByCurrentUser(pathMetadata, filePath);
    assertSingleLinkFile(pathMetadata, filePath);
  }

  const flags =
    fs.constants.O_WRONLY |
    fs.constants.O_APPEND |
    fs.constants.O_CREAT |
    (pathMetadata === undefined ? fs.constants.O_EXCL : 0) |
    (process.platform === 'win32' ? 0 : fs.constants.O_NOFOLLOW ?? 0);
  let fileHandle: fs.promises.FileHandle;

  try {
    fileHandle = await openLogFile(filePath, flags, privateFileMode);
  } catch (error) {
    if (pathMetadata === undefined && isAlreadyExistsError(error)) {
      await appendPrivateLogFile(filePath, content, openLogFile);

      return;
    }

    throw error;
  }

  try {
    const openedFileMetadata = await fileHandle.stat();

    if (!openedFileMetadata.isFile()) {
      throw new Error(`Log file has an unexpected filesystem type: ${filePath}`);
    }

    assertOwnedByCurrentUser(openedFileMetadata, filePath);
    assertSingleLinkFile(openedFileMetadata, filePath);

    if (pathMetadata !== undefined && !hasSameFileIdentity(pathMetadata, openedFileMetadata)) {
      throw createLogFileIdentityChangedError(filePath);
    }

    if (process.platform !== 'win32') {
      if (!hasPrivateMode(openedFileMetadata, privateFileMode)) {
        await fileHandle.chmod(privateFileMode);
      }
    }

    await fileHandle.writeFile(content);
  } finally {
    await fileHandle.close();
  }
}

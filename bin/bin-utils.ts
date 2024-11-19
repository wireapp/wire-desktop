/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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
 */

import {LogFactory, Logger} from '@wireapp/commons';
import {exec} from 'child_process';
import {OptionValues} from 'commander';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {promisify} from 'util';
import {v4 as uuidv4} from 'uuid';

interface BackupResult {
  backupPaths: string[];
  originalPaths: string[];
  tempDir: string;
}

const createTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'wire-build-'));

export async function backupFiles(filePaths: string[]): Promise<BackupResult> {
  const tempDir = await createTempDir();
  const backupPaths = await Promise.all(
    filePaths.map(async filePath => {
      const backupPath = path.join(tempDir, path.basename(filePath));
      await fs.copy(path.resolve(filePath), backupPath);
      return backupPath;
    }),
  );

  return {backupPaths, originalPaths: filePaths, tempDir};
}

export async function restoreFiles({originalPaths, backupPaths, tempDir}: BackupResult): Promise<void> {
  await Promise.all(backupPaths.map((tempPath, index) => fs.copy(tempPath, originalPaths[index], {overwrite: true})));
  await fs.remove(tempDir);
}

export const generateUUID = () => uuidv4();

export const getLogger = (namespace: string, name: string): Logger =>
  LogFactory.getLogger(name, {forceEnable: true, namespace: `@wireapp/${namespace}`, separator: '/'});

export function checkCommanderOptions(
  commanderInstance: OptionValues,
  logdownInstance: Logger,
  options: string[],
): void {
  options.forEach(option => {
    if (!commanderInstance.hasOwnProperty(option)) {
      logdownInstance.error(`Required option "${option}" was not provided.`);
      commanderInstance.outputHelp();
      process.exit(1);
    }
  });
}

export function logEntries<T extends Object>(config: T, name: string, callee: string): void {
  const logger = getLogger(callee, 'build-tools');

  Object.entries(config).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value = value.join(',');
    } else if (value instanceof Object) {
      logEntries(value, `${name}.${key}`, callee);
    } else {
      logger.info(`${name}.${key} set to "${value}". `);
    }
  });
}

interface ExecResult {
  stderr: string;
  stdout: string;
}

export async function execAsync(command: string): Promise<ExecResult> {
  let stderr = '';
  let stdout = '';

  try {
    const execResult = await promisify(exec)(command);
    stdout = execResult.stdout.toString();
    stderr = execResult.stderr.toString();
  } catch (error: any) {
    stderr = error.toString();
  }

  return {stderr: stderr.trim(), stdout: stdout.trim()};
}

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

import {LogFactory, Logger} from '@wireapp/commons/dist/commonjs/LogFactory';
import {exec} from 'child_process';
import commander from 'commander';
import {promisify} from 'util';

export const getLogger = (namespace: string, name: string) =>
  LogFactory.getLogger(name, {namespace: `@wireapp/${namespace}`, forceEnable: true, separator: '/'});

export function checkCommanderOptions(
  commanderInstance: typeof commander,
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

export async function execAsync(command: string, throwOnError: false): Promise<ExecResult>;
export async function execAsync(command: string, throwOnError?: true): Promise<string>;
export async function execAsync(command: string, throwOnError: boolean = true): Promise<ExecResult | string> {
  const {stderr, stdout} = await promisify(exec)(command);
  if (throwOnError) {
    if (!!stderr) {
      throw new Error(stderr);
    }
    return stdout.trim();
  }
  return {stderr: stderr.trim(), stdout: stdout.trim()};
}

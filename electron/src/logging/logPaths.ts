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

import {DateUtil} from '@wireapp/commons';

export type LegacyWebviewLogPathOptions = {
  accountId: string;
  accountIndex: number;
  createdAt: Date;
  logDirectory: string;
};

export type AccountLogFilePathOptions = {
  accountId: string;
  logDirectory: string;
  logFileName: string;
};

export function getLogDirectoryPath(userDataDirectory: string): string {
  return path.join(userDataDirectory, 'logs');
}

export function getMainProcessLogFilePath(logDirectory: string): string {
  return path.join(logDirectory, 'electron.log');
}

export function getLegacyWebviewLogDirectory(options: LegacyWebviewLogPathOptions): string {
  const formattedDate = DateUtil.isoFormat(options.createdAt);
  const accountDirectoryName = `${options.accountIndex}_${formattedDate.date.replaceAll('-', '_')}_${formattedDate.time.replaceAll(':', '_')}_${options.accountId}`;

  return path.join(options.logDirectory, accountDirectoryName);
}

export function getLegacyWebviewLogFilePath(options: LegacyWebviewLogPathOptions, logFileName: string): string {
  return path.join(getLegacyWebviewLogDirectory(options), logFileName);
}

export function getAccountLogFilePath(options: AccountLogFilePathOptions): string {
  return path.join(options.logDirectory, options.accountId, options.logFileName);
}

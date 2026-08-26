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

import * as Electron from 'electron';

import * as path from 'path';

import {config} from '../settings/config';

const app = Electron.app || require('@electron/remote').app;

export const LOG_DIRECTORY_NAME = 'logs';
export const MAIN_PROCESS_LOG_FILE_NAME = 'electron.log';
export const ACCOUNT_LOG_DIRECTORY_NAME = 'accounts';
export const SSO_LOG_FILE_NAME = 'sso.log';

export type WebViewLogPathParameters = {
  accountId: string;
  date: Date;
  logDirectory: string;
};

export type MainProcessLogPathParameters = {
  date: Date;
  logDirectory: string;
};

export type SsoLogPathParameters = {
  accountId: string;
  date: Date;
  logDirectory: string;
};

type DailyLogDirectoryParameters = {
  date: Date;
  logDirectory: string;
};

function getDailyLogDirectory(parameters: DailyLogDirectoryParameters): string {
  const utcDate = parameters.date.toISOString().slice(0, 10);

  return path.join(parameters.logDirectory, utcDate);
}

export function getLogDirectory(): string {
  return path.join(app.getPath('userData'), LOG_DIRECTORY_NAME);
}

export function getMainProcessLogPath(parameters: MainProcessLogPathParameters): string {
  return path.join(getDailyLogDirectory(parameters), MAIN_PROCESS_LOG_FILE_NAME);
}

export function getWebViewLogPath(parameters: WebViewLogPathParameters): string {
  return path.join(
    getDailyLogDirectory(parameters),
    ACCOUNT_LOG_DIRECTORY_NAME,
    parameters.accountId,
    config.logFileName,
  );
}

export function getSsoLogPath(parameters: SsoLogPathParameters): string {
  return path.join(
    getDailyLogDirectory(parameters),
    ACCOUNT_LOG_DIRECTORY_NAME,
    parameters.accountId,
    SSO_LOG_FILE_NAME,
  );
}

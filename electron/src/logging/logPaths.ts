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

import {DateUtil} from '@wireapp/commons';

import {config} from '../settings/config';

const app = Electron.app || require('@electron/remote').app;

export const LOG_DIRECTORY_NAME = 'logs';
export const MAIN_PROCESS_LOG_FILE_NAME = 'electron.log';

export type WebViewLogPathParameters = {
  accountIndex: number;
  date: Date;
  logDirectory: string;
  webViewId: string;
};

export type MainProcessLogPathParameters = {
  logDirectory: string;
};

export type SsoLogPathParameters = {
  logDirectory: string;
  logFileName: string;
  webViewId: string;
};

export function getLogDirectory(): string {
  return path.join(app.getPath('userData'), LOG_DIRECTORY_NAME);
}

export function getMainProcessLogPath(parameters: MainProcessLogPathParameters): string {
  return path.join(parameters.logDirectory, MAIN_PROCESS_LOG_FILE_NAME);
}

export function getWebViewLogPath(parameters: WebViewLogPathParameters): string {
  const {accountIndex, date, logDirectory, webViewId} = parameters;
  const {date: formattedDate, time: formattedTime} = DateUtil.isoFormat(date);
  const directoryName = `${accountIndex}_${formattedDate.replaceAll('-', '_')}_${formattedTime.replaceAll(
    ':',
    '_',
  )}_${webViewId}`;

  return path.join(logDirectory, directoryName, config.logFileName);
}

export function getSsoLogPath(parameters: SsoLogPathParameters): string {
  const {logDirectory, logFileName, webViewId} = parameters;

  return path.join(logDirectory, webViewId, logFileName);
}

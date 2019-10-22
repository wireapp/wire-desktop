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
 *
 */

import {LogFactory, LoggerOptions} from '@wireapp/commons';
import {app, remote} from 'electron';
import * as logdown from 'logdown';
import * as path from 'path';

import {config} from '../settings/config';

const mainProcess = remote ? remote.process : process;

const isDevelopment = config.environment !== 'production';
const forceLogging = mainProcess.argv.includes('--enable-logging');
const userDataDir = (remote ? remote.app : app).getPath('userData');

export const LOGGER_NAMESPACE = '@wireapp/desktop';
export const ENABLE_LOGGING = isDevelopment || forceLogging;
export const LOG_DIR = path.join(userDataDir, 'logs');
export const LOG_FILE = path.join(LOG_DIR, 'electron.log');

export function getLogger(name: string): logdown.Logger {
  const options: LoggerOptions = {
    forceEnable: ENABLE_LOGGING,
    logFilePath: LOG_FILE,
    namespace: LOGGER_NAMESPACE,
    separator: '/',
  };

  return LogFactory.getLogger(name, options);
}

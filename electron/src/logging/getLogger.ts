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

import * as logdown from 'logdown';

import {LogFactory, LoggerOptions} from '@wireapp/commons';

import {fireAndForgetDesktopLogOperation, writeBoundedLogMessage} from './desktopLogWriter';
import {getLogDirectory, getMainProcessLogPath} from './logPaths';

export const LOGGER_NAMESPACE = '@wireapp/desktop';

function writeMainProcessLog(transportOptions: logdown.TransportOptions): void {
  const logFilePath = getMainProcessLogPath({date: new Date(), logDirectory: getLogDirectory()});
  const logMessage = `${transportOptions.args[0]} ${transportOptions.msg}`;

  fireAndForgetDesktopLogOperation(async (): Promise<void> => {
    await writeBoundedLogMessage({logFilePath, message: logMessage});
  });
}

function configureLogTransports(): void {
  if (logdown.transports.length === 0) {
    logdown.transports.push(LogFactory.addTimestamp);
    logdown.transports.push(writeMainProcessLog);
  }
}

export function getLogger(name: string): logdown.Logger {
  const options: LoggerOptions = {
    forceEnable: true,
    logFilePath: getMainProcessLogPath({date: new Date(), logDirectory: getLogDirectory()}),
    namespace: LOGGER_NAMESPACE,
    separator: '/',
  };

  configureLogTransports();

  return LogFactory.getLogger(name, options);
}

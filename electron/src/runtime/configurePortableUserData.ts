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
import minimist from 'minimist';
import {Maybe} from 'true-myth';

import {PortableUserDataPathParameters, resolvePortableUserDataPath} from './portableUserData';

import {config} from '../settings/config';

const app = Electron.app || require('@electron/remote').app;

type CommandLineArguments = Record<string, unknown>;

export type ConfigurePortableUserDataParameters = {
  portableUserDataPathParameters: PortableUserDataPathParameters;
  setUserDataPath: (userDataPath: string) => void;
};

function getPortableUserDataPathParameters(): PortableUserDataPathParameters {
  const commandLineArguments = getCommandLineArguments();

  return {
    appImagePath: Maybe.of(process.env.APPIMAGE),
    executablePath: process.execPath,
    portableModeEnabled: Boolean(commandLineArguments[config.ARGUMENT.PORTABLE]),
    userDataDirectoryArgument: getStringCommandLineArgument(commandLineArguments, config.ARGUMENT.USER_DATA_DIR),
  };
}

function getCommandLineArguments(): CommandLineArguments {
  return minimist(process.argv.slice(1)) as CommandLineArguments;
}

function getStringCommandLineArgument(commandLineArguments: CommandLineArguments, argumentName: string): Maybe<string> {
  const argumentValue = commandLineArguments[argumentName];

  return typeof argumentValue === 'string' ? Maybe.just(argumentValue) : Maybe.nothing<string>();
}

function setConfiguredUserDataPath(userDataPath: string): void {
  app.setPath('userData', userDataPath);
}

export function configurePortableUserData(parameters: ConfigurePortableUserDataParameters): Maybe<string> {
  const configuredUserDataPath = resolvePortableUserDataPath(parameters.portableUserDataPathParameters);

  if (configuredUserDataPath.isJust) {
    parameters.setUserDataPath(configuredUserDataPath.value);
  }

  return configuredUserDataPath;
}

export function configurePortableUserDataAtStartup(): void {
  configurePortableUserData({
    portableUserDataPathParameters: getPortableUserDataPathParameters(),
    setUserDataPath: setConfiguredUserDataPath,
  });
}

export function getConfiguredPortableUserDataPath(): Maybe<string> {
  return resolvePortableUserDataPath(getPortableUserDataPathParameters());
}

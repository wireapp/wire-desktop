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

import {LogFactory} from '@wireapp/commons';
import commander from 'commander';
import path from 'path';

import {logEntries} from '../bin-utils';
import {buildLinuxConfig, buildLinuxWrapper} from './lib/build-linux';
import {buildMacOSConfig, buildMacOSWrapper} from './lib/build-macos';
import {buildWindowsConfig, buildWindowsWrapper} from './lib/build-windows';
import {buildWindowsInstaller, buildWindowsInstallerConfig} from './lib/build-windows-installer';

const toolName = path.basename(__filename).replace('.ts', '');
const logger = LogFactory.getLogger(toolName, {namespace: '@wireapp/build-tools', forceEnable: true});
const appSource = path.join(__dirname, '../../');

commander
  .name(toolName)
  .description(
    'Build the Wire wrapper for your platform.\n\nValid values for platform are: "windows", "windows-installer", "macos", "linux".',
  )
  .option('-e, --env-file <path>', 'Specify the env file path', path.join(appSource, '.env.defaults'))
  .option(
    '-m, --manual-sign',
    `Manually sign and package the app (i.e. don't use electron-packager, macOS and Windows only)`,
  )
  .option('-p, --package-json <path>', 'Specify the package.json path', path.join(appSource, 'package.json'))
  .option('-w, --wire-json <path>', 'Specify the wire.json path', path.join(appSource, 'electron/wire.json'))
  .arguments('<platform>')
  .parse(process.argv);

const platform = (commander.args[0] || '').toLowerCase();

new Promise(() => {
  const {
    envFile,
    manualSign,
    wireJson,
    packageJson,
  }: {envFile: string; manualSign?: boolean; wireJson: string; packageJson: string} = commander as any;

  switch (platform) {
    case 'win':
    case 'windows': {
      const {packagerConfig} = buildWindowsConfig(wireJson, envFile);

      logEntries(packagerConfig, 'packagerConfig', toolName);

      return buildWindowsWrapper(packagerConfig, packageJson, wireJson, envFile);
    }

    case 'windows-installer': {
      const {wInstallerOptions} = buildWindowsInstallerConfig(wireJson, envFile, manualSign);

      logEntries(wInstallerOptions, 'wInstallerOptions', toolName);

      return buildWindowsInstaller(wireJson, envFile, wInstallerOptions);
    }

    case 'mac':
    case 'macos': {
      const {macOSConfig, packagerConfig} = buildMacOSConfig(wireJson, envFile, manualSign);

      logEntries(macOSConfig, 'macOSConfig', toolName);
      logEntries(packagerConfig, 'packagerConfig', toolName);

      return buildMacOSWrapper(packagerConfig, macOSConfig, packageJson, wireJson, envFile, manualSign);
    }

    case 'linux': {
      const {linuxConfig, builderConfig} = buildLinuxConfig(wireJson, envFile);

      logEntries(linuxConfig, 'linuxConfig', toolName);
      logEntries(builderConfig, 'builderConfig', toolName);

      return buildLinuxWrapper(builderConfig, linuxConfig, packageJson, wireJson, envFile);
    }

    default: {
      logger.error(`Invalid or no platform specified.`);
      return commander.help();
    }
  }
}).catch(error => {
  logger.error(error);
  process.exit(1);
});

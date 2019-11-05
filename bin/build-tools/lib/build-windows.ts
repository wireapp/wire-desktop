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

import electronPackager from 'electron-packager';
import fs from 'fs-extra';
import path from 'path';

import {backupFiles, getLogger, restoreFiles} from '../../bin-utils';
import {getCommonConfig} from './commonConfig';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);

interface WindowsConfigResult {
  packagerConfig: electronPackager.Options;
}

export async function buildWindowsConfig(wireJsonPath: string, envFilePath: string): Promise<WindowsConfigResult> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  const packagerConfig: electronPackager.Options = {
    appCopyright: commonConfig.copyright,
    appVersion: commonConfig.version,
    arch: 'ia32',
    asar: commonConfig.enableAsar,
    buildVersion: commonConfig.buildNumber,
    dir: '.',
    icon: `${commonConfig.electronDirectory}/img/logo.ico`,
    ignore: new RegExp(`${commonConfig.electronDirectory}/renderer/src`),
    name: commonConfig.name,
    out: commonConfig.buildDir,
    overwrite: true,
    platform: 'win32',
    protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
    prune: true,
    quiet: false,
    win32metadata: {
      CompanyName: commonConfig.name,
      FileDescription: commonConfig.description,
      InternalName: `${commonConfig.name}.exe`,
      OriginalFilename: `${commonConfig.name}.exe`,
      ProductName: commonConfig.name,
    },
  };

  return {packagerConfig};
}

export async function buildWindowsWrapper(
  packagerConfig: electronPackager.Options,
  packageJsonPath: string,
  wireJsonPath: string,
  envFilePath: string,
): Promise<void> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const packageJsonResolved = path.resolve(packageJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  logger.info(`Building ${commonConfig.name} ${commonConfig.version} for Windows ...`);

  const backup = await backupFiles([packageJsonResolved, wireJsonResolved]);
  const packageJsonContent = await fs.readJson(packageJsonResolved);

  await fs.writeJson(
    packageJsonResolved,
    {...packageJsonContent, productName: commonConfig.name, version: commonConfig.version},
    {spaces: 2},
  );
  await fs.writeJson(wireJsonResolved, commonConfig, {spaces: 2});

  try {
    const [buildDir] = await electronPackager(packagerConfig);
    logger.log(`Built package in "${buildDir}".`);
  } catch (error) {
    logger.error(error);
  }

  await restoreFiles(backup);
}

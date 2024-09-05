/*
 * Wire
 * Copyright (C) 20424 Wire Swiss GmbH
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

import * as electronBuilder from 'electron-builder';
import fs from 'fs-extra';
import path from 'path';

import {backupFiles, getLogger, restoreFiles} from '../../bin-utils';
import {getCommonConfig, flipElectronFuses} from './commonConfig';
import {MSIConfig} from './Config';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);
const mainDir = path.resolve(__dirname, '../../../');

interface MSIConfigResult {
  builderConfig: electronBuilder.Configuration;
  MSIConfig: MSIConfig;
}

export async function buildMSIConfig(
  wireJsonPath: string = path.join(mainDir, 'electron/wire.json'),
  envFilePath: string = path.join(mainDir, '.env.defaults'),
): Promise<MSIConfigResult> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  const MSIConfig: MSIConfig = {
    target: 'msi',
    additionalWixArgs: undefined,
    oneClick: false,
    perMachine: false,
    runAfterFinish: false,
    executableName: `${commonConfig.nameShort}-desktop`,
  };

  const builderConfig: electronBuilder.Configuration = {
    afterPack: afterPackWindows,
    win: {icon: `${commonConfig.electronDirectory}/img/logo.256.png`},
    msi: {
      oneClick: MSIConfig.oneClick,
      perMachine: MSIConfig.perMachine,
      runAfterFinish: MSIConfig.runAfterFinish,
      artifactName: `${MSIConfig.executableName}-${commonConfig.version}.msi`,
    },
    directories: {
      output: commonConfig.distDir,
    },
  };

  return {builderConfig, MSIConfig};
}

async function afterPackWindows(context: electronBuilder.AfterPackContext) {
  await flipElectronFuses(path.join(context.appOutDir, '/Wire.exe'));
}

export async function buildMSIWrapper(
  builderConfig: electronBuilder.Configuration,
  MSIConfig: MSIConfig,
  packageJsonPath: string,
  wireJsonPath: string,
  envFilePath: string,
  architecture: electronBuilder.Arch = electronBuilder.Arch.x64,
): Promise<void> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const packageJsonResolved = path.resolve(packageJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  logger.info(`Building ${commonConfig.name} ${commonConfig.version} for Windows (MSI) ...`);

  const backup = await backupFiles([packageJsonResolved, wireJsonResolved]);
  const packageJsonContent = await fs.readJson(packageJsonResolved);

  await fs.writeJson(
    packageJsonResolved,
    {...packageJsonContent, productName: commonConfig.name, version: commonConfig.version},
    {spaces: 2},
  );
  await fs.writeJson(wireJsonResolved, commonConfig, {spaces: 2});

  try {
    const targets = electronBuilder.Platform.WINDOWS.createTarget(MSIConfig.target, architecture);
    const builtPackages = await electronBuilder.build({config: builderConfig, targets});
    builtPackages.forEach(builtPackage => logger.log(`Built package "${builtPackage}".`));
  } catch (error) {
    logger.error(error);
  }

  await restoreFiles(backup);
}

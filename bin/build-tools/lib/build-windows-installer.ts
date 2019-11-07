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

import {Options as electronWinstallerOptions, createWindowsInstaller} from 'electron-winstaller';
import fs from 'fs-extra';
import path from 'path';

import {backupFiles, getLogger, restoreFiles} from '../../bin-utils';
import {getCommonConfig} from './commonConfig';
import {WindowsConfig} from './Config';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);

export function buildWindowsInstallerConfig(
  wireJsonPath: string,
  envFilePath: string,
  manualSign?: boolean,
): {windowsConfig: WindowsConfig; wInstallerOptions: electronWinstallerOptions} {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = getCommonConfig(envFileResolved, wireJsonResolved);

  const windowsDefaultConfig: WindowsConfig = {
    installerIconUrl: 'https://wire-app.wire.com/win/internal/wire.internal.ico',
    loadingGif: `${commonConfig.electronDirectory}/img/logo.256.png`,
    updateUrl: 'https://wire-app.wire.com/win/internal/',
  };

  const windowsConfig: WindowsConfig = {
    ...windowsDefaultConfig,
    installerIconUrl: process.env.WIN_URL_ICON_INSTALLER || windowsDefaultConfig.installerIconUrl,
    updateUrl: process.env.WIN_URL_UPDATE || windowsDefaultConfig.updateUrl,
  };

  const wInstallerOptions: electronWinstallerOptions = {
    appDirectory: `${commonConfig.buildDir}/${commonConfig.name}-win32-ia32`,
    authors: commonConfig.name,
    copyright: commonConfig.copyright,
    description: commonConfig.description,
    exe: `${commonConfig.name}.exe`,
    iconUrl: windowsConfig.installerIconUrl,
    loadingGif: windowsConfig.loadingGif,
    name: commonConfig.nameShort,
    noMsi: true,
    outputDirectory: commonConfig.distDir,
    setupExe: `${commonConfig.name}-Setup.exe`,
    setupIcon: `${commonConfig.electronDirectory}/img/logo.ico`,
    title: commonConfig.name,
    version: commonConfig.version.replace(/-.*$/, ''),
  };

  if (!manualSign) {
    wInstallerOptions.signWithParams = '/t http://timestamp.digicert.com /fd SHA256 /a';
  }

  commonConfig.updateUrl = windowsConfig.updateUrl;

  return {windowsConfig, wInstallerOptions};
}

export async function buildWindowsInstaller(
  wireJsonPath: string,
  envFilePath: string,
  wInstallerOptions: electronWinstallerOptions,
): Promise<void> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = getCommonConfig(envFileResolved, wireJsonResolved);

  logger.info(`Building ${commonConfig.name} ${commonConfig.version} Installer for Windows ...`);

  const backup = await backupFiles([wireJsonResolved]);
  await fs.writeJson(wireJsonResolved, commonConfig, {spaces: 2});

  try {
    await createWindowsInstaller(wInstallerOptions);
    const buildDir = path.resolve(wInstallerOptions.outputDirectory!);
    logger.log(`Built installer in "${buildDir}"`);
  } catch (error) {
    logger.error(error);
  }

  await restoreFiles(backup);
}

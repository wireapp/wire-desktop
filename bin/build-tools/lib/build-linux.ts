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

import * as electronBuilder from 'electron-builder';
import fs from 'fs-extra';
import path from 'path';

import {backupFiles, getLogger, restoreFiles} from '../../bin-utils';
import {getCommonConfig, flipElectronFuses} from './commonConfig';
import {LinuxConfig} from './Config';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);
const mainDir = path.resolve(__dirname, '../../../');

interface LinuxConfigResult {
  builderConfig: electronBuilder.Configuration;
  linuxConfig: LinuxConfig;
}

export async function buildLinuxConfig(
  wireJsonPath: string = path.join(mainDir, 'electron/wire.json'),
  envFilePath: string = path.join(mainDir, '.env.defaults'),
): Promise<LinuxConfigResult> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  const linuxDefaultConfig: LinuxConfig = {
    artifactName: '${productName}-${version}_${arch}.${ext}',
    categories: 'Network;InstantMessaging;Chat;VideoConference',
    executableName: `${commonConfig.nameShort}-desktop`,
    genericName: 'Secure messenger',
    keywords: 'chat;encrypt;e2e;messenger;videocall',
    targets: ['AppImage', 'deb', 'rpm'],
  };

  const linuxConfig: LinuxConfig = {
    ...linuxDefaultConfig,
    categories: process.env.LINUX_CATEGORIES || linuxDefaultConfig.categories,
    executableName: process.env.LINUX_NAME_SHORT || linuxDefaultConfig.executableName,
    keywords: process.env.LINUX_KEYWORDS || linuxDefaultConfig.keywords,
    targets: process.env.LINUX_TARGET ? process.env.LINUX_TARGET.split(',') : linuxDefaultConfig.targets,
  };

  const linuxDesktopConfig = {
    Categories: linuxConfig.categories,
    GenericName: linuxConfig.genericName,
    Keywords: linuxConfig.keywords,
    MimeType: `x-scheme-handler/${commonConfig.customProtocolName}`,
    Name: commonConfig.name,
    StartupWMClass: commonConfig.name,
    Version: '1.1',
  };

  const platformSpecificConfig = {
    afterInstall: 'bin/deb/after-install.tpl',
    afterRemove: 'bin/deb/after-remove.tpl',
    category: 'Network',
    desktop: linuxDesktopConfig,
    fpm: ['--name', linuxConfig.executableName],
  };

  const rpmDepends = ['alsa-lib', 'libnotify', 'libXScrnSaver', 'libXtst', 'nss'];
  const debDepends = ['libasound2', 'libnotify-bin', 'libnss3', 'libxss1'];

  const builderConfig: electronBuilder.Configuration = {
    afterPack: afterPackLinux,
    appImage: {
      artifactName: linuxConfig.artifactName,
      category: platformSpecificConfig.category,
      desktop: linuxDesktopConfig,
      publish: null,
    },
    asar: commonConfig.enableAsar,
    buildVersion: commonConfig.version,
    deb: {
      ...platformSpecificConfig,
      depends: debDepends,
    },
    directories: {
      buildResources: 'resources',
      output: commonConfig.distDir,
    },
    extraMetadata: {
      homepage: commonConfig.websiteUrl,
    },
    files: ['!**/.yarn', '!**/renderer/src', '!**/electron/src', '!**/bin', '!**/jenkins'],
    linux: {
      artifactName: linuxConfig.artifactName,
      category: platformSpecificConfig.category,
      executableName: linuxConfig.executableName,
      target: linuxConfig.targets,
    },
    productName: commonConfig.name,
    publish: null,
    removePackageScripts: true,
    rpm: {
      ...platformSpecificConfig,
      depends: rpmDepends,
    },
  };

  return {builderConfig, linuxConfig};
}

async function afterPackLinux(context: electronBuilder.AfterPackContext) {
  await flipElectronFuses(path.join(context.appOutDir, context.packager.platformSpecificBuildOptions.executableName));
}

export async function buildLinuxWrapper(
  builderConfig: electronBuilder.Configuration,
  linuxConfig: LinuxConfig,
  packageJsonPath: string,
  wireJsonPath: string,
  envFilePath: string,
  architecture: electronBuilder.Arch = electronBuilder.Arch.x64,
): Promise<void> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const packageJsonResolved = path.resolve(packageJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  const targets = electronBuilder.Platform.LINUX.createTarget(linuxConfig.targets, architecture);

  logger.info(
    `Building ${commonConfig.name} ${commonConfig.version} for Linux (target${
      linuxConfig.targets.length === 1 ? '' : 's'
    }: ${linuxConfig.targets.join(', ')}) ...`,
  );

  const backup = await backupFiles([packageJsonResolved, wireJsonResolved]);
  const packageJsonContent = await fs.readJson(packageJsonResolved);

  await fs.writeJson(
    packageJsonResolved,
    {...packageJsonContent, productName: commonConfig.name, version: commonConfig.version},
    {spaces: 2},
  );
  await fs.writeJson(wireJsonResolved, commonConfig, {spaces: 2});

  try {
    const builtPackages = await electronBuilder.build({config: builderConfig, targets});
    builtPackages.forEach(builtPackage => logger.log(`Built package "${builtPackage}".`));
  } catch (error) {
    logger.error(error);
  }

  await restoreFiles(backup);
}

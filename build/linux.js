#!/usr/bin/env node

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

//@ts-check

const fs = require('fs-extra');
const path = require('path');
const electronBuilder = require('electron-builder');
const {commonConfig, defaultConfig, logEntries} = require('./common');

const CONFIG_JSON = path.resolve(__dirname, '../electron/wire.json');
const ELECTRON_PACKAGE_JSON = path.resolve(__dirname, '../electron/package.json');
const electronMetadata = require(ELECTRON_PACKAGE_JSON);

/** @type {import('./Config').LinuxConfig} */
const linuxDefaultConfig = {
  artifactName: '${productName}-${version}_${arch}.${ext}',
  categories: 'Network;InstantMessaging;Chat;VideoConference',
  keywords: 'chat;encrypt;e2e;messenger;videocall',
  nameShort: commonConfig.name,
  targets: ['AppImage', 'deb', 'rpm'],
};

if (commonConfig.environment === 'internal') {
  linuxDefaultConfig.artifactName = '${productName}-${version}-internal_${arch}.${ext}';
}

/** @type {import('./Config').LinuxConfig} */
const linuxConfig = {
  ...linuxDefaultConfig,
  categories: process.env.LINUX_CATEGORIES || linuxDefaultConfig.categories,
  keywords: process.env.LINUX_KEYWORDS || linuxDefaultConfig.keywords,
  nameShort: process.env.LINUX_NAME_SHORT || linuxDefaultConfig.nameShort,
  targets: process.env.LINUX_TARGET ? [process.env.LINUX_TARGET] : linuxDefaultConfig.targets,
};

const linuxDesktopConfig = {
  Categories: linuxConfig.categories,
  GenericName: commonConfig.description,
  Keywords: linuxConfig.keywords,
  MimeType: `x-scheme-handler/${commonConfig.customProtocolName}`,
  Name: commonConfig.nameShort,
  StartupWMClass: commonConfig.nameShort,
  Version: '1.1',
};

const platformSpecificConfig = {
  afterInstall: 'bin/deb/after-install.tpl',
  afterRemove: 'bin/deb/after-remove.tpl',
  category: 'Network',
  desktop: linuxDesktopConfig,
  fpm: ['--name', linuxConfig.nameShort],
};

const rpmDepends = ['alsa-lib', 'GConf2', 'libappindicator', 'libnotify', 'libXScrnSaver', 'libXtst', 'nss'];
const debDepends = ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'];

/** @type {import('electron-builder').Configuration}  */
const builderConfig = {
  asar: false,
  deb: {
    ...platformSpecificConfig,
    depends: debDepends,
  },
  directories: {
    app: 'electron',
    buildResources: 'resources',
    output: 'wrap/dist',
  },
  extraMetadata: {
    homepage: commonConfig.websiteUrl,
  },
  linux: {
    artifactName: linuxConfig.artifactName,
    category: platformSpecificConfig.category,
    depends: debDepends,
    executableName: linuxConfig.nameShort,
    target: linuxConfig.targets,
  },
  productName: commonConfig.name,
  publish: null,
  rpm: {
    ...platformSpecificConfig,
    depends: rpmDepends,
  },
};

const newElectronMetadata = {
  ...electronMetadata,
  version: commonConfig.version,
};

logEntries(commonConfig, 'commonConfig');

(async () => {
  const targets = electronBuilder.Platform.LINUX.createTarget(
    linuxConfig.targets,
    electronBuilder.archFromString('x64')
  );

  console.info(`Building ${commonConfig.name} for Linux v${commonConfig.version} ...`);

  await fs.writeFile(ELECTRON_PACKAGE_JSON, `${JSON.stringify(newElectronMetadata, null, 2)}\n`);
  await fs.writeFile(CONFIG_JSON, `${JSON.stringify(commonConfig, null, 2)}\n`);

  try {
    const buildFiles = await electronBuilder.build({config: builderConfig, targets});
    buildFiles.forEach(buildFile => {
      console.log(`Built package "${buildFile}".`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await fs.writeFile(CONFIG_JSON, `${JSON.stringify(defaultConfig, null, 2)}\n`);
    await fs.writeFile(ELECTRON_PACKAGE_JSON, `${JSON.stringify(electronMetadata, null, 2)}\n`);
  }
})();

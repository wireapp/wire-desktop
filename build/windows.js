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
const electronPackager = require('electron-packager');
const {commonConfig, defaultConfig, logEntries} = require('./common');

const CONFIG_JSON = path.resolve(__dirname, '../electron/wire.json');
const ELECTRON_PACKAGE_JSON = path.resolve(__dirname, '../electron/package.json');
const originalElectronJson = require(ELECTRON_PACKAGE_JSON);

/** @type {import('electron-packager').Options}  */
const packagerOptions = {
  appCopyright: commonConfig.copyright,
  appVersion: commonConfig.version,
  arch: 'ia32',
  asar: true,
  buildVersion: commonConfig.buildNumber,
  dir: 'electron',
  icon: 'electron/img/logo.ico',
  ignore: /electron\/renderer\/src/,
  name: commonConfig.name,
  out: 'wrap/build',
  overwrite: true,
  platform: 'win32',
  protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
  quiet: false,
  win32metadata: {
    CompanyName: commonConfig.name,
    FileDescription: commonConfig.description,
    InternalName: `${commonConfig.name}.exe`,
    OriginalFilename: `${commonConfig.name}.exe`,
    ProductName: commonConfig.name,
  },
};

const newElectronPackageJson = {
  ...originalElectronJson,
  version: commonConfig.version,
};

logEntries(commonConfig, 'commonConfig');

(async () => {
  console.info(`Building ${commonConfig.name} for Windows v${commonConfig.version} ...`);

  await fs.writeFile(ELECTRON_PACKAGE_JSON, `${JSON.stringify(newElectronPackageJson, null, 2)}\n`);
  await fs.writeFile(CONFIG_JSON, `${JSON.stringify(commonConfig, null, 2)}\n`);

  try {
    const [buildDir] = await electronPackager(packagerOptions);
    console.log(`Built package in "${buildDir}".`);
  } catch (error) {
    console.error(error);
  } finally {
    await fs.writeFile(CONFIG_JSON, `${JSON.stringify(defaultConfig, null, 2)}\n`);
    await fs.writeFile(ELECTRON_PACKAGE_JSON, `${JSON.stringify(originalElectronJson, null, 2)}\n`);
  }
})();

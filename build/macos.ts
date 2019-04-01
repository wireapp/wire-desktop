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

import * as electronPackager from 'electron-packager';
import * as fs from 'fs-extra';
import * as path from 'path';
import {commonConfig, defaultConfig, logEntries} from './common';
import {MacOSConfig} from './Config';

const CONFIG_JSON = path.resolve(__dirname, '../electron/wire.json');
const ELECTRON_PACKAGE_JSON = path.resolve(__dirname, '../electron/package.json');
const originalElectronJson = require(ELECTRON_PACKAGE_JSON);

const macOsDefaultConfig: MacOSConfig = {
  bundleId: 'com.wearezeta.zclient.mac',
  category: 'public.app-category.social-networking',
  certNameApplication: null,
  certNameInstaller: null,
  notarizeAppleId: null,
  notarizeApplePassword: null,
};

const macOsConfig: MacOSConfig = {
  ...macOsDefaultConfig,
  bundleId: process.env.MACOS_BUNDLE_ID || macOsDefaultConfig.bundleId,
  certNameApplication: process.env.MACOS_CERTIFICATE_NAME_APPLICATION || macOsDefaultConfig.certNameApplication,
  certNameInstaller: process.env.MACOS_CERTIFICATE_NAME_INSTALLER || macOsDefaultConfig.certNameInstaller,
  notarizeAppleId: process.env.MACOS_NOTARIZE_APPLE_ID || macOsDefaultConfig.notarizeAppleId,
  notarizeApplePassword: process.env.MACOS_NOTARIZE_APPLE_PASSWORD || macOsDefaultConfig.notarizeApplePassword,
};

const packagerOptions: electronPackager.Options = {
  appBundleId: macOsConfig.bundleId,
  appCategoryType: 'public.app-category.social-networking',
  appCopyright: commonConfig.copyright,
  appVersion: commonConfig.version,
  asar: true,
  buildVersion: commonConfig.buildNumber,
  darwinDarkModeSupport: true,
  dir: 'electron',
  extendInfo: 'resources/macos/custom.plist',
  helperBundleId: `${macOsConfig.bundleId}.helper`,
  icon: 'resources/macos/logo.icns',
  ignore: /electron\/renderer\/src/,
  name: commonConfig.name,
  out: 'wrap/build',
  overwrite: true,
  platform: 'mas',
  protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
  quiet: false,
};

if (macOsConfig.certNameApplication) {
  packagerOptions.osxSign = {
    entitlements: 'resources/macos/entitlements/parent.plist',
    'entitlements-inherit': 'resources/macos/entitlements/child.plist',
    identity: macOsConfig.certNameApplication,
  };
}

if (macOsConfig.notarizeAppleId && macOsConfig.notarizeApplePassword) {
  packagerOptions.osxNotarize = {
    appleId: macOsConfig.notarizeAppleId,
    appleIdPassword: macOsConfig.notarizeApplePassword,
  };
}

const newElectronPackageJson = {
  ...originalElectronJson,
  version: commonConfig.version,
};

logEntries(commonConfig, 'commonConfig');

(async () => {
  console.info(`Building ${commonConfig.name} for macOS v${commonConfig.version} ...`);

  await fs.writeFile(ELECTRON_PACKAGE_JSON, `${JSON.stringify(newElectronPackageJson, null, 2)}\n`);
  await fs.writeFile(CONFIG_JSON, `${JSON.stringify(commonConfig, null, 2)}\n`);

  const [buildDir] = await electronPackager(packagerOptions);
  console.log(`Built package in "${buildDir}".`);
})()
  .finally(() =>
    Promise.all([
      fs.writeFile(CONFIG_JSON, `${JSON.stringify(defaultConfig, null, 2)}\n`),
      fs.writeFile(ELECTRON_PACKAGE_JSON, `${JSON.stringify(originalElectronJson, null, 2)}\n`),
    ])
  )
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

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

/** @type {import('./Config').MacOSConfig} */
const macOsDefaultConfig = {
  bundleId: 'com.wearezeta.zclient.mac',
  category: 'public.app-category.social-networking',
  certNameApplication: null,
  certNameInstaller: null,
  notarizeAppleId: null,
  notarizeApplePassword: null,
};

/** @type {import('./Config').MacOSConfig} */
const macOsConfig = {
  ...macOsDefaultConfig,
  bundleId: process.env.MACOS_BUNDLE_ID || macOsDefaultConfig.bundleId,
  certNameApplication: process.env.MACOS_CERTIFICATE_NAME_APPLICATION || macOsDefaultConfig.certNameApplication,
  certNameInstaller: process.env.MACOS_CERTIFICATE_NAME_INSTALLER || macOsDefaultConfig.certNameInstaller,
  notarizeAppleId: process.env.MACOS_NOTARIZE_APPLE_ID || macOsDefaultConfig.notarizeAppleId,
  notarizeApplePassword: process.env.MACOS_NOTARIZE_APPLE_PASSWORD || macOsDefaultConfig.notarizeApplePassword,
};

/** @type {import('electron-packager').Options}  */
const packagerOptions = {
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

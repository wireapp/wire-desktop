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

import {notarize, NotarizeCredentials, NotarizeOptions, validateAuthorizationArgs} from 'electron-notarize';
import * as electronBuilder from 'electron-builder';
import fs from 'fs-extra';
import path from 'path';

import {backupFiles, getLogger, restoreFiles} from '../../bin-utils';
import {getCommonConfig} from './commonConfig';
import {MacOSConfig} from './Config';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);
const mainDir = path.resolve(__dirname, '../../../');

interface MacOSConfigResult {
  builderConfig: electronBuilder.Configuration;
  macOSConfig: MacOSConfig;
}

interface PlistEntries {
  ElectronTeamID: string;
  ITSAppUsesNonExemptEncryption?: boolean;
  ITSEncryptionExportComplianceCode?: string;
  NSCameraUsageDescription: string;
  NSContactsUsageDescription: string;
  NSMicrophoneUsageDescription: string;
  NSPrincipalClass: string;
}

export async function buildMacOSConfig(
  wireJsonPath: string = path.join(mainDir, 'electron/wire.json'),
  envFilePath: string = path.join(mainDir, '.env.defaults'),
): Promise<MacOSConfigResult> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const plistInfoPath = path.resolve('resources/macos/Info.plist.json');
  const plistEntries: PlistEntries = await fs.readJson(plistInfoPath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  const macOSDefaultConfig: MacOSConfig = {
    appleExportComplianceCode: null,
    bundleId: 'com.wearezeta.zclient.mac',
    category: 'public.app-category.social-networking',
    certNameApplication: null,
    certNameInstaller: null,
    certNameNotarization: null,
    electronMirror: null,
    notarizeAppleId: null,
    notarizeApplePassword: null,
  };

  const macOSConfig: MacOSConfig = {
    ...macOSDefaultConfig,
    appleExportComplianceCode: process.env.APPLE_EXPORT_COMPLIANCE_CODE || macOSDefaultConfig.appleExportComplianceCode,
    bundleId: process.env.MACOS_BUNDLE_ID || macOSDefaultConfig.bundleId,
    certNameApplication: process.env.MACOS_CERTIFICATE_NAME_APPLICATION || macOSDefaultConfig.certNameApplication,
    certNameInstaller: process.env.MACOS_CERTIFICATE_NAME_INSTALLER || macOSDefaultConfig.certNameInstaller,
    certNameNotarization: process.env.MACOS_CERTIFICATE_NAME_NOTARIZATION || macOSDefaultConfig.certNameNotarization,
    electronMirror: process.env.MACOS_ELECTRON_MIRROR_URL || macOSDefaultConfig.electronMirror,
    notarizeAppleId: process.env.MACOS_NOTARIZE_APPLE_ID || macOSDefaultConfig.notarizeAppleId,
    notarizeApplePassword: process.env.MACOS_NOTARIZE_APPLE_PASSWORD || macOSDefaultConfig.notarizeApplePassword,
  };

  if (macOSConfig.appleExportComplianceCode) {
    plistEntries.ITSAppUsesNonExemptEncryption = true;
    plistEntries.ITSEncryptionExportComplianceCode = macOSConfig.appleExportComplianceCode;
  }

  const builderConfig: electronBuilder.Configuration = {
    afterPack: async (context: electronBuilder.AfterPackContext) => {
      if (context.targets[0].name === 'dmg') {
        logger.info('Notarizing app ...');
        const appName = context.packager.appInfo.productFilename;
        const appFile = path.join(context.appOutDir, `${appName}.app`);
        // await manualNotarize(appFile, macOSConfig);
      }
    },
    appId: macOSConfig.bundleId,
    buildVersion: commonConfig.version,
    copyright: commonConfig.copyright,
    directories: {
      output: commonConfig.distDir,
    },
    dmg: {
      icon: path.resolve('resources/macos/logo.icns'),
      title: commonConfig.name,
    },
    extraMetadata: {
      homepage: commonConfig.websiteUrl,
    },
    files: [],
    mac: {
      asar: commonConfig.enableAsar,
      category: 'public.app-category.social-networking',
      darkModeSupport: true,
      entitlements: path.resolve('resources/macos/entitlements/parent.plist'),
      entitlementsInherit: path.resolve('resources/macos/entitlements/parent.plist'),
      extendInfo: plistEntries,
      forceCodeSigning: true,
      hardenedRuntime: true,
      helperBundleId: `${macOSConfig.bundleId}.helper`,
      icon: path.resolve('resources/macos/logo.icns'),
      identity: macOSConfig.certNameNotarization,
      target: ['dmg', 'mas'],
    },
    mas: {
      entitlementsInherit: path.resolve('resources/macos/entitlements/child.plist'),
      identity: macOSConfig.certNameInstaller as string,
    },
    productName: commonConfig.name,
    protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
    publish: null,
    removePackageScripts: true,
    ...(macOSConfig.electronMirror && {
      electronDownload: {
        mirror: macOSConfig.electronMirror,
      },
    }),
  };

  return {builderConfig, macOSConfig};
}

export async function buildMacOSWrapper(
  builderConfig: electronBuilder.Configuration,
  packageJsonPath: string,
  wireJsonPath: string,
  envFilePath: string,
): Promise<void> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const packageJsonResolved = path.resolve(packageJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  logger.info(`Building ${commonConfig.name} ${commonConfig.version} for macOS ...`);

  const backup = await backupFiles([packageJsonResolved, wireJsonResolved]);
  const packageJsonContent = await fs.readJson(packageJsonResolved);

  await fs.writeJson(
    packageJsonResolved,
    {...packageJsonContent, productName: commonConfig.name, version: commonConfig.version},
    {spaces: 2},
  );
  await fs.writeJson(wireJsonResolved, commonConfig, {spaces: 2});

  try {
    const builtPackages = await electronBuilder.build({config: builderConfig});
    console.info({builtPackages});

    logger.log(`Built app for the App Store in "${commonConfig.buildDir}".`);
    logger.log(`Built App Store installer in "${commonConfig.distDir}".`);
    logger.log(`Built app for outside distribution in "${commonConfig.buildDir}".`);
    logger.log(`Built outside distribution archive in "${commonConfig.distDir}".`);
  } catch (error) {
    logger.error(error);
  }

  await restoreFiles(backup);
}

export async function manualNotarize(appFile: string, macOSConfig: MacOSConfig): Promise<void> {
  const notarizeCredentials: NotarizeCredentials = {
    appleId: macOSConfig.notarizeAppleId as string,
    appleIdPassword: macOSConfig.notarizeApplePassword as string,
  };
  const notarizeOptions: NotarizeOptions = {
    appBundleId: macOSConfig.bundleId,
    appPath: appFile,
    ...notarizeCredentials,
  };
  validateAuthorizationArgs(notarizeCredentials);
  await notarize(notarizeOptions);
}

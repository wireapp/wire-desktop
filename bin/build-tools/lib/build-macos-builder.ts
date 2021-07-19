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
const buildDmg = require('electron-installer-dmg');
import fs from 'fs-extra';
import path from 'path';

import {backupFiles, execAsync, getLogger, restoreFiles} from '../../bin-utils';
import {getCommonConfig} from './commonConfig';
import {CommonConfig, MacOSConfig} from './Config';

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
  signManually?: boolean,
  shouldNotarize?: boolean,
): Promise<MacOSConfigResult> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const plistInfoResolved = path.resolve('resources/macos/Info.plist.json');
  const plistEntries: PlistEntries = await fs.readJson(plistInfoResolved);
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
    buildVersion: commonConfig.version,
    copyright: commonConfig.copyright,
    directories: {
      app: '.',
      output: commonConfig.distDir,
    },
    mac: {
      appId: macOSConfig.bundleId,
      asar: commonConfig.enableAsar,
      bundleVersion: commonConfig.version,
      category: 'public.app-category.social-networking',
      darkModeSupport: true,
      entitlements: 'resources/macos/entitlements/parent.plist',
      entitlementsInherit: shouldNotarize
        ? 'resources/macos/entitlements/parent.plist'
        : 'resources/macos/entitlements/child.plist',
      extendInfo: plistEntries,
      forceCodeSigning: true,
      hardenedRuntime: !!shouldNotarize,
      helperBundleId: `${macOSConfig.bundleId}.helper`,
      icon: 'resources/macos/logo.icns',
      identity: (shouldNotarize ? macOSConfig.certNameNotarization : macOSConfig.certNameApplication) as string,
      target: shouldNotarize ? 'dmg' : 'mas',
    },
    productName: commonConfig.name,
    protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
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
  macOSConfig: MacOSConfig,
  packageJsonPath: string,
  wireJsonPath: string,
  envFilePath: string,
  signManually?: boolean,
  shouldNotarize?: boolean,
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

    if (!shouldNotarize) {
      logger.log(`Built app for the App Store in "${commonConfig.buildDir}".`);

      if (macOSConfig.certNameInstaller) {
        await fs.ensureDir(commonConfig.distDir);

        logger.log(`Built App Store installer in "${commonConfig.distDir}".`);
      }
    } else {
      logger.log(`Built app for outside distribution in "${commonConfig.buildDir}".`);

      const appFile = path.join(commonConfig.buildDir, `${commonConfig.name}.app`);
      await fs.ensureDir(commonConfig.distDir);

      await manualNotarize(appFile, macOSConfig);

      await buildDmg({
        appPath: appFile,
        debug: logger.state.isEnabled,
        icon: path.resolve('resources/macos/logo.icns'),
        name: commonConfig.name,
        out: path.resolve(commonConfig.distDir),
        title: commonConfig.name,
      });

      logger.log(`Built outside distribution archive in "${commonConfig.distDir}".`);
    }
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

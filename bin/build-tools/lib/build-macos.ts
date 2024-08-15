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

import {flatAsync as buildPkg} from '@electron/osx-sign';
import electronPackager, {ArchOption} from 'electron-packager';
import fs from 'fs-extra';
import path from 'path';

import {backupFiles, execAsync, getLogger, restoreFiles} from '../../bin-utils';
import {flipElectronFuses, getCommonConfig} from './commonConfig';
import {CommonConfig, MacOSConfig} from './Config';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);
const mainDir = path.resolve(__dirname, '../../../');

interface MacOSConfigResult {
  macOSConfig: MacOSConfig;
  packagerConfig: electronPackager.Options;
}

export async function buildMacOSConfig(
  wireJsonPath: string = path.join(mainDir, 'electron/wire.json'),
  envFilePath: string = path.join(mainDir, '.env.defaults'),
  signManually?: boolean,
  architecture: ArchOption = 'universal',
): Promise<MacOSConfigResult> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const plistInfoResolved = path.resolve('resources/macos/Info.plist.json');
  const plistEntries = await fs.readJson(plistInfoResolved);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  const macOSDefaultConfig: MacOSConfig = {
    appleExportComplianceCode: null,
    bundleId: 'com.wearezeta.zclient.mac',
    category: 'public.app-category.social-networking',
    certNameApplication: null,
    certNameInstaller: null,
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
    electronMirror: process.env.MACOS_ELECTRON_MIRROR_URL || macOSDefaultConfig.electronMirror,
    notarizeAppleId: process.env.MACOS_NOTARIZE_APPLE_ID || macOSDefaultConfig.notarizeAppleId,
    notarizeApplePassword: process.env.MACOS_NOTARIZE_APPLE_PASSWORD || macOSDefaultConfig.notarizeApplePassword,
  };

  if (macOSConfig.appleExportComplianceCode) {
    plistEntries['ITSAppUsesNonExemptEncryption'] = true;
    plistEntries['ITSEncryptionExportComplianceCode'] = macOSConfig.appleExportComplianceCode;
  }

  const packagerConfig: electronPackager.Options = {
    appBundleId: macOSConfig.bundleId,
    appCategoryType: 'public.app-category.social-networking',
    appCopyright: commonConfig.copyright,
    appVersion: commonConfig.version,
    arch: architecture,
    asar: commonConfig.enableAsar,
    buildVersion: commonConfig.buildNumber,
    darwinDarkModeSupport: true,
    dir: '.',
    extendInfo: plistEntries,
    helperBundleId: `${macOSConfig.bundleId}.helper`,
    icon: 'resources/macos/logo.icns',
    ignore: [/\/electron\/renderer\/src$/, /\/\.yarn$/, /\$electron\/src$/, /\/bin$/, /\/jenkins$/],
    name: commonConfig.name,
    osxUniversal: {
      mergeASARs: true,
    },
    out: commonConfig.buildDir,
    overwrite: true,
    platform: 'mas',
    protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
    prune: true,
    quiet: false,
  };

  if (macOSConfig.electronMirror) {
    packagerConfig.download = {
      mirrorOptions: {
        mirror: macOSConfig.electronMirror,
      },
    };
  }

  if (!signManually) {
    if (macOSConfig.certNameApplication) {
      packagerConfig.osxSign = {
        optionsForFile: () => ({
          entitlements: 'resources/macos/entitlements/parent.plist',
        }),
        identity: macOSConfig.certNameApplication,
      };
    }

    if (macOSConfig.notarizeAppleId && macOSConfig.notarizeApplePassword) {
      packagerConfig.osxNotarize = {
        appleId: macOSConfig.notarizeAppleId,
        appleIdPassword: macOSConfig.notarizeApplePassword,
      };
    }
  }

  return {macOSConfig, packagerConfig};
}

export async function buildMacOSWrapper(
  packagerConfig: electronPackager.Options,
  macOSConfig: MacOSConfig,
  packageJsonPath: string,
  wireJsonPath: string,
  envFilePath: string,
  signManually?: boolean,
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
    const [buildDir] = await electronPackager(packagerConfig);

    logger.log(`Built app in "${buildDir}".`);

    const appFile = path.join(buildDir, `${commonConfig.name}.app`);
    await flipElectronFuses(appFile);

    if (macOSConfig.certNameInstaller) {
      await fs.ensureDir(commonConfig.distDir);
      const pkgFile = path.join(commonConfig.distDir, `${commonConfig.name}.pkg`);

      if (signManually) {
        await manualMacOSSign(appFile, pkgFile, commonConfig, macOSConfig);
      } else {
        await buildPkg({
          app: appFile,
          identity: macOSConfig.certNameInstaller,
          pkg: pkgFile,
          platform: 'mas',
        });
      }

      logger.log(`Built installer in "${commonConfig.distDir}".`);
    }
  } catch (error) {
    logger.error(error);
  }

  await restoreFiles(backup);
}

export async function manualMacOSSign(
  appFile: string,
  pkgFile: string,
  commonConfig: CommonConfig,
  macOSConfig: MacOSConfig,
): Promise<void> {
  const inheritEntitlements = 'resources/macos/entitlements/child.plist';
  const mainEntitlements = 'resources/macos/entitlements/parent.plist';

  if (macOSConfig.certNameApplication) {
    const filesToSign = [
      'Frameworks/Electron Framework.framework/Versions/A/Electron Framework',
      'Frameworks/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib',
      'Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib',
      'Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib',
      'Frameworks/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libEGL.dylib',
      'Frameworks/Electron Framework.framework/Versions/A/Libraries/libswiftshader_libGLESv2.dylib',
      'Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib',
      'Frameworks/Electron Framework.framework/',
      `Frameworks/${commonConfig.name} Helper.app/Contents/MacOS/${commonConfig.name} Helper`,
      `Frameworks/${commonConfig.name} Helper.app/`,
      `Frameworks/${commonConfig.name} Helper (GPU).app/Contents/MacOS/${commonConfig.name} Helper (GPU)`,
      `Frameworks/${commonConfig.name} Helper (GPU).app/`,
      `Frameworks/${commonConfig.name} Helper (Plugin).app/Contents/MacOS/${commonConfig.name} Helper (Plugin)`,
      `Frameworks/${commonConfig.name} Helper (Plugin).app/`,
      `Frameworks/${commonConfig.name} Helper (Renderer).app/Contents/MacOS/${commonConfig.name} Helper (Renderer)`,
      `Frameworks/${commonConfig.name} Helper (Renderer).app/`,
      `Library/LoginItems/${commonConfig.name} Login Helper.app/Contents/MacOS/${commonConfig.name} Login Helper`,
      `Library/LoginItems/${commonConfig.name} Login Helper.app/`,
    ];

    for (const fileName of filesToSign) {
      const fullPath = `${appFile}/Contents/${fileName}`;
      const {stderr, stdout} = await execAsync(
        `codesign --deep -fs '${macOSConfig.certNameApplication}' --entitlements '${inheritEntitlements}' '${fullPath}'`,
      );
      logger.log(stdout);
      logger.warn(stderr);
    }

    if (macOSConfig.certNameInstaller) {
      const appExecutable = `${appFile}/Contents/MacOS/${commonConfig.name}`;
      const {stderr: stderrSignExecutable, stdout: stdoutSignExecutable} = await execAsync(
        `codesign -fs '${macOSConfig.certNameApplication}' --entitlements '${mainEntitlements}' '${appExecutable}'`,
      );
      logger.log(stdoutSignExecutable);
      logger.warn(stderrSignExecutable);

      const {stderr: stderrSignApp, stdout: stdoutSignApp} = await execAsync(
        `codesign -fs '${macOSConfig.certNameApplication}' --entitlements '${mainEntitlements}' '${appFile}'`,
      );
      logger.log(stdoutSignApp);
      logger.warn(stderrSignApp);

      const {stderr: stderrPkg, stdout: stdoutPkg} = await execAsync(
        `productbuild --component '${appFile}' /Applications --sign '${macOSConfig.certNameInstaller}' '${pkgFile}'`,
      );
      logger.log(stdoutPkg);
      logger.warn(stderrPkg);
    }
  }
}

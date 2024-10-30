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

import {flipFuses, FuseV1Options, FuseVersion} from '@electron/fuses';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';

import {execAsync, getLogger} from '../../bin-utils';
import {CommonConfig} from './Config';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);

interface Result {
  commonConfig: CommonConfig;
  defaultConfig: CommonConfig;
}

export async function getCommonConfig(envFile: string, wireJson: string): Promise<Result> {
  const defaultConfig: CommonConfig = await fs.readJson(wireJson);
  const envFileResolved = path.resolve(envFile);

  dotenv.config({path: envFileResolved});

  const IS_PRODUCTION = process.env.APP_ENV !== 'internal';

  const getProjectVersion = async () => {
    const {stdout: commitId} = await execAsync('git rev-parse --short HEAD');

    const versionWithoutZero = (defaultConfig.version || '0').replace(/\.0$/, '');
    const buildNumber = `${process.env.BUILD_NUMBER || `0-${commitId || 'unknown'}`}`;
    const maybeInternal = IS_PRODUCTION ? '' : '-internal';

    return `${versionWithoutZero}.${buildNumber}${maybeInternal}`;
  };

  const commonConfig: CommonConfig = {
    ...defaultConfig,
    aboutReleasesUrl: process.env.URL_ABOUT_RELEASES || defaultConfig.aboutReleasesUrl,
    aboutUpdatesUrl: process.env.URL_ABOUT_UPDATES || defaultConfig.aboutUpdatesUrl,
    adminUrl: process.env.URL_ADMIN || defaultConfig.adminUrl,
    appBase: process.env.APP_BASE || defaultConfig.appBase,
    buildDir: defaultConfig.buildDir || 'wrap/build',
    buildNumber: process.env.BUILD_NUMBER || defaultConfig.buildNumber,
    copyright: process.env.APP_COPYRIGHT || defaultConfig.copyright,
    customProtocolName: process.env.APP_CUSTOM_PROTOCOL_NAME || defaultConfig.customProtocolName,
    description: process.env.APP_DESCRIPTION || defaultConfig.description,
    distDir: defaultConfig.distDir || 'wrap/dist',
    electronDirectory: defaultConfig.electronDirectory || 'electron',
    enableAsar: process.env.ENABLE_ASAR === 'false' ? false : defaultConfig.enableAsar,
    environment: IS_PRODUCTION ? 'production' : defaultConfig.environment,
    legalUrl: process.env.URL_LEGAL || defaultConfig.legalUrl,
    licensesUrl: process.env.URL_LICENSES || defaultConfig.licensesUrl,
    maximumAccounts: process.env.APP_MAXIMUM_ACCOUNTS || defaultConfig.maximumAccounts,
    name: process.env.APP_NAME || defaultConfig.name,
    nameShort: process.env.APP_NAME_SHORT || defaultConfig.nameShort,
    privacyUrl: process.env.URL_PRIVACY || defaultConfig.privacyUrl,
    raygunApiKey: process.env.RAYGUN_API_KEY || defaultConfig.raygunApiKey,
    supportUrl: process.env.URL_SUPPORT || defaultConfig.supportUrl,
    version: await getProjectVersion(),
    websiteUrl: process.env.URL_WEBSITE || defaultConfig.websiteUrl,
  };

  return {commonConfig, defaultConfig};
}

export async function flipElectronFuses(pathToElectron: string) {
  logger.log(`Flipping fuses in "${pathToElectron}".`);
  await flipFuses(pathToElectron, {
    // see also https://www.electronjs.org/docs/latest/tutorial/fuses
    version: FuseVersion.V1,
    // Electron-Default: Enabled
    //
    // The runAsNode fuse toggles whether the ELECTRON_RUN_AS_NODE environment variable is respected or not.
    // Please note that if this fuse is disabled then process.fork in the main process will not function as
    // expected as it depends on this environment variable to function.
    [FuseV1Options.RunAsNode]: false,
    // Electron-Default: Disabled
    //
    // The cookieEncryption fuse toggles whether the cookie store on disk is encrypted using OS level cryptography keys.
    // By default the sqlite database that Chromium uses to store cookies stores the values in plaintext.
    // If you wish to ensure your apps cookies are encrypted in the same way Chrome does then you should enable this fuse.
    // Please note it is a one-way transition, if you enable this fuse existing unencrypted cookies will be encrypted-on-write
    // but if you then disable the fuse again your cookie store will effectively be corrupt and useless.
    // Most apps can safely enable this fuse.
    [FuseV1Options.EnableCookieEncryption]: true,
    // Electron-Default: Enabled
    //
    // The nodeOptions fuse toggles whether the NODE_OPTIONS environment variable is respected or not.
    // This environment variable can be used to pass all kinds of custom options to the Node.js runtime and isn't typically
    // used by apps in production.
    // Most apps can safely disable this fuse.
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    // Electron-Default: Enabled
    //
    // The nodeCliInspect fuse toggles whether the --inspect, --inspect-brk, etc. flags are respected or not.
    // When disabled it also ensures that SIGUSR1 signal does not initialize the main process inspector.
    // Most apps can safely disable this fuse.
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    // Electron-Default: Disabled
    // The embeddedAsarIntegrityValidation fuse toggles an experimental feature on macOS that validates the
    // content of the app.asar file when it is loaded. This feature is designed to have a minimal performance
    // impact but may marginally slow down file reads from inside the app.asar archive.
    //
    // For more information on how to use asar integrity validation please read the Asar Integrity documentation.
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
    // ElectronDefault: Disabled
    //
    //The onlyLoadAppFromAsar fuse changes the search system that Electron uses to locate your app code.
    // By default Electron will search in the following order app.asar -> app -> default_app.asar.
    // When this fuse is enabled the search order becomes a single entry app.asar thus ensuring that when combined
    // with the embeddedAsarIntegrityValidation fuse it is impossible to load non-validated code.
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
  });
}

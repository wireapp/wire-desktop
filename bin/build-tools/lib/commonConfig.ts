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

import {execSync} from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';

import {CommonConfig} from './Config';

export const getCommonConfig = (envFile: string, wireJson: string) => {
  const defaultConfig: CommonConfig = fs.readJsonSync(wireJson);
  const envFileResolved = path.resolve(envFile);

  dotenv.config({path: envFileResolved});

  const IS_PRODUCTION = process.env.APP_ENV !== 'internal';

  const getProjectVersion = () => {
    let commitId = 'unknown';

    try {
      commitId = execSync('git rev-parse --short HEAD')
        .toString()
        .trim();
    } catch (error) {}

    const versionWithoutZero = (defaultConfig.version || '0').replace(/\.0$/, '');
    const buildNumber = `${process.env.BUILD_NUMBER || `0-${commitId}`}`;
    const maybeInternal = IS_PRODUCTION ? '' : '-internal';

    return `${versionWithoutZero}.${buildNumber}${maybeInternal}`;
  };

  const commonConfig: CommonConfig = {
    ...defaultConfig,
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
    version: getProjectVersion(),
    websiteUrl: process.env.URL_WEBSITE || defaultConfig.websiteUrl,
  };

  return {commonConfig, defaultConfig};
};

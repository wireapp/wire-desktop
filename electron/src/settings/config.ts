/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

interface WireJson {
  aboutReleasesUrl: string;
  aboutUpdatesUrl: string;
  adminUrl: string;
  appBase: string;
  buildNumber: string;
  copyright: string;
  customProtocolName: string;
  description: string;
  electronDirectory: string;
  environment: 'internal' | 'production';
  legalUrl: string;
  licensesUrl: string;
  maximumAccounts: string;
  name: string;
  nameShort: string;
  privacyUrl: string;
  supportUrl: string;
  updateUrl: string;
  version: string;
  websiteUrl: string;
}

const wireJson: WireJson = require('../../wire.json');

export const MINUTE_IN_MILLIS = 60 * 1000;
export const HOUR_IN_MILLIS = 60 * MINUTE_IN_MILLIS;

const squirrelUpdateInterval = {
  /** 5 minutes in milliseconds */
  DELAY: 5 * MINUTE_IN_MILLIS,
  /** 24 hours in milliseconds */
  INTERVAL: 24 * HOUR_IN_MILLIS,
};

/** Command line arguments */
enum ARGUMENT {
  DEVTOOLS = 'devtools',
  ENV = 'env',
  HIDDEN = 'hidden',
  PORTABLE = 'portable',
  PROXY_SERVER = 'proxy-server',
  STARTUP = 'startup',
  USER_DATA_DIR = 'user_data_dir',
  VERSION = 'version',
  DLPATH = 'dlpath',
}

export const config = {
  ...wireJson,
  ARGUMENT,
  appUserModelId: `com.squirrel.wire.${wireJson.name.toLowerCase()}`,
  backendOrigins: ['https://staging-nginz-https.zinfra.io', 'https://prod-nginz-https.wire.com'],
  logFileName: 'console.log',
  maximumAccounts: parseInt(wireJson.maximumAccounts, 10),
  squirrelUpdateInterval,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
};

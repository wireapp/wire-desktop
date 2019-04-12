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
  raygunApiKey: string;
  supportUrl: string;
  updateUrl: string;
  version: string;
  websiteUrl: string;
}

const wireJson: WireJson = require('../../wire.json');

const squirrelUpdateInterval = {
  /** 5 minutes */
  DELAY: 5 * 60 * 1000,
  /** 24 hours */
  INTERVAL: 24 * 60 * 60 * 1000,
};

const config = {
  ...wireJson,
  backendOrigins: ['https://staging-nginz-https.zinfra.io', 'https://prod-nginz-https.wire.com'],
  logFileName: 'console.log',
  maximumAccounts: parseInt(wireJson.maximumAccounts, 10),
  squirrelUpdateInterval,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
};

export {config};

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

import {LogFactory} from '@wireapp/commons';
import {app} from 'electron';
import * as path from 'path';

interface CommonConfig {
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

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron.log');
const config: CommonConfig = require('../../wire.json');
const logger = LogFactory.getLogger('config', {forceEnable: true, logFilePath: LOG_FILE});

const COMMON_CONFIG = {
  ...config,
  maximumAccounts: parseInt(config.maximumAccounts, 10),
};

Object.keys(COMMON_CONFIG).forEach(configKey => {
  if (typeof configKey === 'undefined') {
    logger.warn(`Configuration key "${configKey}" not defined.`);
  }
});

const BACKEND_ORIGINS = ['https://staging-nginz-https.zinfra.io', 'https://prod-nginz-https.wire.com'];

const LOG_FILE_NAME = 'console.log';

const UPDATE = {
  /** 5 minutes */
  DELAY: 5 * 60 * 1000,
  /** 24 hours */
  INTERVAL: 24 * 60 * 60 * 1000,
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36';

export {BACKEND_ORIGINS, COMMON_CONFIG, LOG_FILE_NAME, UPDATE, USER_AGENT};

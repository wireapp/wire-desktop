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

const pkg: {maximumAccounts: string; productName: string; version: string} = require('../../package.json');

const BACKEND_ORIGINS = ['https://staging-nginz-https.zinfra.io', 'https://prod-nginz-https.wire.com'];

const LOG_FILE_NAME = 'console.log';

const MAXIMUM_ACCOUNTS = pkg.maximumAccounts || 3;

const NAME = pkg.productName || 'Wire';

const RAYGUN_API_KEY = '';

const UPDATE = {
  DELAY: 5 * 60 * 1000,
  INTERVAL: 24 * 60 * 60 * 1000,
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36';

const VERSION = pkg.version;

export {BACKEND_ORIGINS, LOG_FILE_NAME, MAXIMUM_ACCOUNTS, NAME, RAYGUN_API_KEY, UPDATE, USER_AGENT, VERSION};

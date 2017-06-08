/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

'use strict';

const pkg = require('./../package.json');

const SEC_IN_MIN = 60;
const MIN_IN_HOUR = 60;
const HOUR_IN_DAY = 24;
const SEC = 1000;
const MIN = SEC_IN_MIN * SEC;
const HOUR = MIN_IN_HOUR * MIN;
const DAY = HOUR_IN_DAY * HOUR;

const UPDATE_DELAY_MINUTES = 5;

const config = {
  CONSOLE_LOG: 'console.log',
  CRYPTO: 'crypto',
  DEFAULT_HEIGHT_MAIN: 768,
  DEFAULT_WIDTH_MAIN: 1024,
  DEV: 'dev',
  DEV_URL: 'https://wire-webapp-dev.zinfra.io/',
  EDGE: 'edge',
  EDGE_URL: 'https://wire-webapp-edge.zinfra.io/',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GOOGLE_SCOPES: 'https://www.googleapis.com/auth/contacts.readonly',
  HEIGHT_AUTH: 576,
  INTERNAL: 'internal',
  INTERNAL_URL: 'https://wire-webapp-staging.wire.com/?env=prod',
  LOCALE: [
    'en',
    'cs',
    'da',
    'de',
    'es',
    'fi',
    'fr',
    'hr',
    'hu',
    'it',
    'lt',
    'pt',
    'ro',
    'ru',
    'sk',
    'sl',
    'tr',
    'uk',
  ],
  LOCALHOST: 'localhost',
  LOCALHOST_URL: 'http://localhost:8888/',
  MIN_HEIGHT_MAIN: 512,
  MIN_WIDTH_MAIN: 760,
  PROD: 'prod',
  PROD_URL: 'https://app.wire.com/',
  RAYGUN_API_KEY: '',
  SPELL_SUGGESTIONS: 4,
  SPELL_SUPPORTED: ['en'],
  STAGING: 'staging',
  STAGING_URL: 'https://wire-webapp-staging.zinfra.io/',
  UPDATE_DELAY: UPDATE_DELAY_MINUTES * MIN,
  UPDATE_INTERVAL: DAY,
  WHITE_LIST: ['https://www.wire.com/', 'https://wire.com/'],
  WIDTH_AUTH: 400,
  WIRE: 'https://wire.com',
  WIRE_LEGAL: 'https://wire.com/legal/',
  WIRE_LICENSES: 'https://wire.com/legal/licenses/',
  WIRE_PRIVACY: 'https://wire.com/privacy/',
  WIRE_SUPPORT: 'https://support.wire.com',
};

config.ENVIRONMENT = pkg.environment;
config.PRODUCTION = config.ENVIRONMENT === 'production';
config.DEVELOPMENT = !config.PRODUCTION;
config.UPDATE_WIN_URL = pkg.updateWinUrl;
config.VERSION = pkg.version;
config.NAME = pkg.productName;

module.exports = config;

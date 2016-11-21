/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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

let config = {
  WIRE: 'https://wire.com',
  WIRE_SUPPORT: 'https://support.wire.com',
  WIRE_LEGAL: 'https://wire.com/legal/',
  WIRE_PRIVACY: 'https://wire.com/privacy/',
  WIRE_LICENSES: 'https://wire.com/legal/licenses/',

  INTERNAL_URL: 'https://wire-webapp-staging.wire.com/?env=prod',
  PRODUCTION_URL: 'https://app.wire.com/',
  STAGING_URL: 'https://wire-webapp-staging.zinfra.io/',
  DEV_URL: 'https://wire-webapp-dev.zinfra.io/',
  EDGE_URL: 'https://wire-webapp-edge.zinfra.io/',
  LOCALHOST_URL: 'http://localhost:8888/',

  MIN_WIDTH_MAIN: 760,
  MIN_HEIGHT_MAIN: 512,

  DEFAULT_WIDTH_MAIN: 1024,
  DEFAULT_HEIGHT_MAIN: 768,

  WIDTH_AUTH: 400,
  HEIGHT_AUTH: 576,

  WHITE_LIST: [
    'https://www.wire.com/',
    'https://wire.com/',
  ],

  LOCALE: [
    'en',
    'de',
    'es',
    'fi',
    'fr',
    'hr',
    'ro',
    'ru',
    'tr',
    'uk',
  ],

  RAYGUN_API_KEY: '',

  GOOGLE_SCOPES: 'https://www.googleapis.com/auth/contacts.readonly',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',

  CONSOLE_LOG: 'console.log',
};

config.ENVIRONMENT = pkg.environment;
config.PRODUCTION = config.ENVIRONMENT === 'production';
config.DEVELOPMENT = !config.PRODUCTION;
config.UPDATE_WIN_URL = pkg.updateWinUrl;
config.VERSION = pkg.version;
config.NAME = pkg.productName;

module.exports = config;

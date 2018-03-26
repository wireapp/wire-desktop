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


const pkg = require('./../package.json');
const settings = require('./lib/settings');

const URL_ADMIN = {
  PRODUCTION: 'https://teams.wire.com',
  STAGING: 'https://wire-admin-staging.zinfra.io',
};

const URL_SUPPORT = 'https://support.wire.com';

const URL_WEBSITE = {
  PRODUCTION: 'https://wire.com',
  STAGING: 'https://wire-website-staging.zinfra.io',
};

const _app = {
  ENV: pkg.environment,
  UPDATE_URL_WIN: pkg.updateWinUrl,
};

const _platform = {
  IS_LINUX: process.platform === 'linux',
  IS_MAC_OS: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
};

const _web = {
  get_url_admin: () => _is_prod_environment() ? URL_ADMIN.PRODUCTION : URL_ADMIN.STAGING,
  get_url_support: () => URL_SUPPORT,
  get_url_website: () => _is_prod_environment() ? URL_WEBSITE.PRODUCTION : URL_WEBSITE.STAGING,
};

module.exports = {
  app: _app,
  platform: _platform,
  web: _web,
};

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

let currentEnvironment = undefined;

const TYPE = {
  DEV: 'dev',
  EDGE: 'edge',
  INTERNAL: 'internal',
  LOCALHOST: 'localhost',
  PRODUCTION: 'production',
  STAGING: 'staging',
};

const URL_ADMIN = {
  PRODUCTION: 'https://teams.wire.com',
  STAGING: 'https://wire-admin-staging.zinfra.io',
};

const URL_SUPPORT = 'https://support.wire.com';

const URL_WEBSITE = {
  PRODUCTION: 'https://wire.com',
  STAGING: 'https://wire-website-staging.zinfra.io',
};

const URL_WEBAPP = {
  DEV: 'https://wire-webapp-dev.zinfra.io',
  EDGE: 'https://wire-webapp-edge.zinfra.io',
  INTERNAL: 'https://wire-webapp-staging.wire.com/?env=prod',
  LOCALHOST: 'http://localhost:8080/app',
  PRODUCTION: 'https://app.wire.com',
  STAGING: 'https://wire-webapp-staging.zinfra.io',
};

const app = {
  ENV: pkg.environment,
  IS_DEVELOPMENT: pkg.environment !== 'production',
  IS_PRODUCTION: pkg.environment === 'production',
  UPDATE_URL_WIN: pkg.updateWinUrl,
};

const getEnvironment = () => {
  return currentEnvironment = currentEnvironment || settings.restore('env', TYPE.INTERNAL);
};

const isProdEnvironment = () => {
  return [
    TYPE.INTERNAL,
    TYPE.PRODUCTION,
  ].includes(getEnvironment());
};

const platform = {
  IS_LINUX: process.platform === 'linux',
  IS_MAC_OS: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
};

const setEnvironment = (env) => {
  currentEnvironment = env || settings.restore('env', TYPE.INTERNAL);
  settings.save('env', currentEnvironment);
};

const web = {
  getAdminUrl: path => {
    const baseUrl = isProdEnvironment() ? URL_ADMIN.PRODUCTION : URL_ADMIN.STAGING;
    return `${baseUrl}${path ? path : ''}`;
  },
  getSupportUrl: path => `${URL_SUPPORT}${path ? path : ''}`,
  getWebappUrl: (env) => {
    if (env) {
      return env;
    }

    if (app.IS_DEVELOPMENT) {
      switch (getEnvironment()) {
        case TYPE.DEV:
          return URL_WEBAPP.DEV;
        case TYPE.EDGE:
          return URL_WEBAPP.EDGE;
        case TYPE.INTERNAL:
          return URL_WEBAPP.INTERNAL;
        case TYPE.LOCALHOST:
          return URL_WEBAPP.LOCALHOST;
        case TYPE.STAGING:
          return URL_WEBAPP.STAGING;
        default:
          break;
      }
    }

    return URL_WEBAPP.PRODUCTION;
  },
  getWebsiteUrl: path => {
    const baseUrl = isProdEnvironment() ? URL_WEBSITE.PRODUCTION : URL_WEBSITE.STAGING;
    return `${baseUrl}${path ? path : ''}`;
  },
};

module.exports = {
  TYPE,
  app,
  getEnvironment,
  platform,
  setEnvironment,
  web,
};

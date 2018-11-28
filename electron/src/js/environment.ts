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

import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';
const pkg: {environment: string; updateWinUrl: string} = require('../../package.json');

let currentEnvironment: TYPE;

enum TYPE {
  DEV = 'DEV',
  EDGE = 'EDGE',
  INTERNAL = 'INTERNAL',
  LOCALHOST = 'LOCALHOST',
  LOCALHOST_PRODUCTION = 'LOCALHOST_PRODUCTION',
  PRODUCTION = 'PRODUCTION',
  STAGING = 'STAGING',
}

enum TYPE_LABEL {
  DEV = 'Development',
  EDGE = 'Edge',
  INTERNAL = 'Internal',
  LOCALHOST = 'Localhost',
  LOCALHOST_PRODUCTION = 'Localhost (Production)',
  PRODUCTION = 'Production',
  STAGING = 'Staging',
}

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
  LOCALHOST: 'http://localhost:8081',
  LOCALHOST_PRODUCTION: 'http://localhost:8081/?env=prod',
  PRODUCTION: 'https://app.wire.com',
  STAGING: 'https://wire-webapp-staging.zinfra.io',
};

const app = {
  ENV: pkg.environment,
  IS_DEVELOPMENT: pkg.environment !== 'production',
  IS_PRODUCTION: pkg.environment === 'production',
  UPDATE_URL_WIN: pkg.updateWinUrl,
};

const getEnvironment = (): TYPE => {
  return currentEnvironment ? currentEnvironment : restoreEnvironment();
};

const isProdEnvironment = (): boolean => {
  return [TYPE.INTERNAL, TYPE.PRODUCTION].includes(getEnvironment());
};

const platform = {
  IS_LINUX: process.platform === 'linux',
  IS_MAC_OS: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
};

const restoreEnvironment = (): TYPE => {
  currentEnvironment = settings.restore(SettingsType.ENV, TYPE.INTERNAL);
  return <TYPE>currentEnvironment;
};

const setEnvironment = (env: TYPE): void => {
  currentEnvironment = env ? env : restoreEnvironment();
  settings.save(SettingsType.ENV, currentEnvironment);
};

const web = {
  getAdminUrl: (path?: string): string => {
    const baseUrl = isProdEnvironment() ? URL_ADMIN.PRODUCTION : URL_ADMIN.STAGING;
    return `${baseUrl}${path ? path : ''}`;
  },
  getSupportUrl: (path?: string): string => `${URL_SUPPORT}${path ? path : ''}`,
  getWebappUrl: (env?: string): string => {
    if (env) {
      return env;
    }

    if (app.IS_DEVELOPMENT) {
      const currentEnvironment = getEnvironment();
      if (currentEnvironment) {
        return URL_WEBAPP[<TYPE>currentEnvironment.toUpperCase()];
      }
    }

    return URL_WEBAPP.PRODUCTION;
  },
  getWebsiteUrl: (path?: string): string => {
    const baseUrl = isProdEnvironment() ? URL_WEBSITE.PRODUCTION : URL_WEBSITE.STAGING;
    return `${baseUrl}${path ? path : ''}`;
  },
};

export {TYPE, TYPE_LABEL, URL_WEBAPP, app, getEnvironment, platform, setEnvironment, web};

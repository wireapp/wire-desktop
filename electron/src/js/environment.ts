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
const pkg: {
  adminUrl: string;
  appBase: string;
  environment: string;
  legalUrl: string;
  licensesUrl: string;
  privacyUrl: string;
  supportUrl: string;
  updateWinUrl: string;
  websiteUrl: string;
} = require('../../package.json');

let currentEnvironment: BackendType;

enum BackendType {
  DEV = 'DEV',
  EDGE = 'EDGE',
  INTERNAL = 'INTERNAL',
  LOCALHOST = 'LOCALHOST',
  PRODUCTION = 'PRODUCTION',
  RC = 'RC',
}

enum BackendTypeLabel {
  DEV = 'Development',
  EDGE = 'Edge',
  INTERNAL = 'Internal',
  LOCALHOST = 'Localhost',
  PRODUCTION = 'Production',
  RC = 'RC',
}

const URL_ADMIN = {
  PRODUCTION: pkg.adminUrl || 'https://teams.wire.com',
  STAGING: 'https://wire-admin-staging.zinfra.io',
};

const URL_LEGAL = pkg.legalUrl || 'https://wire.com/legal/';
const URL_LICENSES = pkg.licensesUrl || 'https://wire.com/legal/licenses/';
const URL_PRIVACY = pkg.privacyUrl || 'https://wire.com/privacy/';
const URL_SUPPORT = pkg.supportUrl || 'https://support.wire.com';

const URL_WEBSITE = {
  PRODUCTION: pkg.websiteUrl || 'https://wire.com',
  STAGING: 'https://wire-website-staging.zinfra.io',
};

const URL_WEBAPP = {
  DEV: 'https://wire-webapp-dev.zinfra.io',
  EDGE: 'https://wire-webapp-edge.zinfra.io',
  INTERNAL: 'https://wire-webapp-staging.wire.com/',
  LOCALHOST: 'http://localhost:8081',
  PRODUCTION: pkg.appBase || 'https://app.wire.com',
  RC: 'https://wire-webapp-rc.zinfra.io',
};

const app = {
  ENV: pkg.environment,
  IS_DEVELOPMENT: pkg.environment !== 'production',
  IS_PRODUCTION: pkg.environment === 'production',
  UPDATE_URL_WIN: pkg.updateWinUrl,
};

const getEnvironment = (): BackendType => {
  return <BackendType>(currentEnvironment ? currentEnvironment : restoreEnvironment()).toUpperCase();
};

const isProdEnvironment = (): boolean => {
  return [BackendType.INTERNAL, BackendType.PRODUCTION].includes(getEnvironment());
};

const isLinuxDesktop = (identifier: string): boolean => {
  const xdgDesktop = process.env.XDG_CURRENT_DESKTOP;
  return !!xdgDesktop && xdgDesktop.includes(identifier);
};

const platform = {
  IS_LINUX: process.platform === 'linux',
  IS_MAC_OS: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
};

const linuxDesktop = {
  isGnome: isLinuxDesktop('GNOME'),
  isPopOS: isLinuxDesktop('pop'),
  isUbuntuUnity: isLinuxDesktop('Unity'),
};

const restoreEnvironment = (): BackendType => {
  currentEnvironment = settings.restore(SettingsType.ENV, BackendType.INTERNAL);
  return <BackendType>currentEnvironment;
};

const setEnvironment = (env: BackendType): void => {
  currentEnvironment = env ? env : restoreEnvironment();
  settings.save(SettingsType.ENV, currentEnvironment.toUpperCase());
};

const web = {
  getAdminUrl: (path?: string): string => {
    const baseUrl = isProdEnvironment() ? URL_ADMIN.PRODUCTION : URL_ADMIN.STAGING;
    return `${baseUrl}${path ? path : ''}`;
  },
  getWebappUrl: (env?: string): string => {
    if (env) {
      return env;
    }

    if (app.IS_DEVELOPMENT) {
      const currentEnvironment = getEnvironment();
      if (currentEnvironment) {
        return URL_WEBAPP[<BackendType>currentEnvironment.toUpperCase()];
      }
    }

    return URL_WEBAPP.PRODUCTION;
  },
  getWebsiteUrl: (path?: string): string => {
    const baseUrl = isProdEnvironment() ? URL_WEBSITE.PRODUCTION : URL_WEBSITE.STAGING;
    return `${baseUrl}${path ? path : ''}`;
  },
};

export {
  app,
  BackendType,
  BackendTypeLabel,
  getEnvironment,
  linuxDesktop,
  platform,
  setEnvironment,
  URL_LEGAL,
  URL_LICENSES,
  URL_PRIVACY,
  URL_SUPPORT,
  URL_WEBAPP,
  web,
};

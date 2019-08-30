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

import {config} from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';

export const BackendType = {
  DEVELOPMENT: 'Development',
  EDGE: 'Edge',
  INTERNAL: 'Internal',
  LOCALHOST: 'Localhost',
  PRODUCTION: 'Production',
  RC: 'RC',
};

export type BackendTypeKey = keyof typeof BackendType;

let currentEnvironment: BackendTypeKey;

const URL_ADMIN = {
  PRODUCTION: config.adminUrl,
  STAGING: 'https://wire-admin-staging.zinfra.io',
};

const URL_WEBSITE = {
  PRODUCTION: config.websiteUrl,
  STAGING: 'https://wire-website-staging.zinfra.io',
};

export const URL_WEBAPP = {
  DEVELOPMENT: 'https://wire-webapp-dev.zinfra.io',
  EDGE: 'https://wire-webapp-edge.zinfra.io',
  INTERNAL: 'https://wire-webapp-staging.wire.com/',
  LOCALHOST: 'http://localhost:8081',
  PRODUCTION: config.appBase,
  RC: 'https://wire-webapp-rc.zinfra.io',
};

export const app = {
  ENV: config.environment,
  IS_DEVELOPMENT: config.environment !== 'production',
  IS_PRODUCTION: config.environment === 'production',
  UPDATE_URL_WIN: config.updateUrl,
};

export const getEnvironment = (): BackendTypeKey => {
  return (currentEnvironment ? currentEnvironment : restoreEnvironment()).toUpperCase() as BackendTypeKey;
};

const isProdEnvironment = (): boolean => {
  const env = getEnvironment();
  return env === BackendType.INTERNAL.toUpperCase() || env === BackendType.PRODUCTION.toUpperCase();
};

const isEnvVar = (envVar: string, value: string, caseSensitive = false): boolean => {
  let envVarContent = process.env[envVar] || '';

  if (!caseSensitive) {
    envVar = envVar.toLowerCase();
    envVarContent = envVarContent.toLowerCase();
  }

  return envVarContent.includes(value);
};

export const platform = {
  IS_LINUX: process.platform === 'linux',
  IS_MAC_OS: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
};

export const linuxDesktop = {
  isGnomeX11: isEnvVar('XDG_CURRENT_DESKTOP', 'gnome') && isEnvVar('XDG_SESSION_TYPE', 'x11'),
  isPopOS: isEnvVar('XDG_CURRENT_DESKTOP', 'pop'),
  isUbuntuUnity: isEnvVar('XDG_CURRENT_DESKTOP', 'Unity'),
};

const restoreEnvironment = (): BackendTypeKey => {
  return settings.restore(SettingsType.ENV, BackendType.INTERNAL.toUpperCase() as BackendTypeKey);
};

export const setEnvironment = (env: BackendTypeKey): void => {
  currentEnvironment = env ? env : restoreEnvironment();
  settings.save(SettingsType.ENV, currentEnvironment.toUpperCase());
};

export const web = {
  getAdminUrl: (path?: string): string => {
    const baseUrl = isProdEnvironment() ? URL_ADMIN.PRODUCTION : URL_ADMIN.STAGING;
    return `${baseUrl}${path || ''}`;
  },
  getWebappUrl: (env?: string): string => {
    if (env) {
      return env;
    }

    if (app.IS_DEVELOPMENT) {
      const currentEnvironment = getEnvironment();
      if (currentEnvironment) {
        return URL_WEBAPP[currentEnvironment.toUpperCase() as BackendTypeKey];
      }
    }

    return URL_WEBAPP.PRODUCTION;
  },
  getWebsiteUrl: (path?: string): string => {
    const baseUrl = isProdEnvironment() ? URL_WEBSITE.PRODUCTION : URL_WEBSITE.STAGING;
    return `${baseUrl}${path || ''}`;
  },
};

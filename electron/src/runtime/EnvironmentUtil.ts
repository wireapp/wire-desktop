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

export enum BackendType {
  AVS = 'AVS',
  CUSTOM = 'CUSTOM',
  DEVELOPMENT = 'DEVELOPMENT',
  EDGE = 'EDGE',
  INTERNAL = 'INTERNAL',
  LOCALHOST = 'LOCALHOST',
  MASTER = 'MASTER',
  PRODUCTION = 'PRODUCTION',
  QA = 'QA',
}

let currentEnvironment: BackendType;

const URL_ADMIN = {
  PRODUCTION: config.adminUrl,
  STAGING: 'https://wire-admin-staging.zinfra.io',
};

const URL_WEBSITE = {
  PRODUCTION: config.websiteUrl,
  STAGING: 'https://wire-website-staging.zinfra.io',
};

/* eslint-disable sort-keys-fix/sort-keys-fix */
export const URL_WEBAPP: Record<BackendType, string> = {
  AVS: 'https://wire-webapp-avs.zinfra.io',
  DEVELOPMENT: 'https://wire-webapp-dev.zinfra.io',
  EDGE: 'https://wire-webapp-edge.zinfra.io',
  MASTER: 'https://wire-webapp-master.zinfra.io',
  QA: 'https://wire-webapp-qa.zinfra.io',
  INTERNAL: 'https://wire-webapp-staging.wire.com',
  LOCALHOST: 'http://localhost:8081',
  PRODUCTION: config.appBase,
  CUSTOM: '',
};
/* eslint-enable sort-keys-fix/sort-keys-fix */

export const app = {
  ENV: config.environment,
  IS_DEVELOPMENT: config.environment !== 'production',
  IS_PRODUCTION: config.environment === 'production',
  UPDATE_URL_WIN: config.updateUrl,
};

export const getEnvironment = (): BackendType => currentEnvironment || restoreEnvironment();

const isProdEnvironment = (): boolean => {
  const env = getEnvironment();
  return env === BackendType.INTERNAL || env === BackendType.PRODUCTION || env === BackendType.CUSTOM;
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

const restoreEnvironment = (): BackendType => {
  let restoredEnvironment = settings.restore(SettingsType.ENV, BackendType.INTERNAL);
  if (!Object.values(BackendType).includes(restoredEnvironment)) {
    restoredEnvironment = BackendType.INTERNAL;
    setEnvironment(restoredEnvironment);
  }
  return restoredEnvironment;
};

export const setEnvironment = (env?: BackendType, customURL?: string): void => {
  currentEnvironment = env || restoreEnvironment();
  settings.save(SettingsType.ENV, currentEnvironment);
  if (customURL) {
    settings.save(SettingsType.CUSTOM_WEBAPP_URL, customURL);
  }
  settings.persistToFile();
};

export const web = {
  getAdminUrl: (path: string = ''): string => {
    const baseUrl = isProdEnvironment() ? URL_ADMIN.PRODUCTION : URL_ADMIN.STAGING;
    return `${baseUrl}${path}`;
  },
  getWebappUrl: (env?: string): string => {
    if (env) {
      return env;
    }

    if (app.IS_DEVELOPMENT) {
      const currentEnvironment = getEnvironment();
      if (currentEnvironment === BackendType.CUSTOM) {
        const envUrl = settings.restore(SettingsType.CUSTOM_WEBAPP_URL, '');
        return envUrl || URL_WEBAPP.PRODUCTION;
      }
      return URL_WEBAPP[currentEnvironment];
    }

    return URL_WEBAPP.PRODUCTION;
  },
  getWebsiteUrl: (path?: string): string => {
    const baseUrl = isProdEnvironment() ? URL_WEBSITE.PRODUCTION : URL_WEBSITE.STAGING;
    return `${baseUrl}${path || ''}`;
  },
};

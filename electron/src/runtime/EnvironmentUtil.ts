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

import minimist from 'minimist';

import {config} from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';

const argv = minimist(process.argv.slice(1));
const customWebappUrl: string | undefined = argv[config.ARGUMENT.ENV];
const isProdEnvironment = !!customWebappUrl;

export enum ServerType {
  PRODUCTION = 'PRODUCTION',
  EDGE = 'EDGE',
  STAGING = 'STAGING',
}

interface AvailableEnvironment {
  name: string;
  server?: ServerType;
  url: string;
  isActive: boolean;
}

let currentEnvironment: ServerType;

const URL_ADMIN = {
  PRODUCTION: config.adminUrl,
  STAGING: 'https://wire-admin-staging.zinfra.io',
};

const URL_WEBSITE = {
  PRODUCTION: config.websiteUrl,
  STAGING: 'https://wire-website-staging.zinfra.io',
};

const webappEnvironments = {
  [ServerType.PRODUCTION]: {name: 'production', server: ServerType.PRODUCTION, url: 'https://app.wire.com'},
  [ServerType.STAGING]: {name: 'beta', server: ServerType.STAGING, url: 'https://wire-webapp-staging.wire.com'},
  [ServerType.EDGE]: {name: 'edge', server: ServerType.EDGE, url: 'https://wire-webapp-edge.zinfra.io'},
} as const;

export const app = {
  ENV: config.environment,
  IS_DEVELOPMENT: config.environment !== 'production',
  IS_PRODUCTION: config.environment === 'production',
  UPDATE_URL_WIN: config.updateUrl,
};

export const getEnvironment = (): ServerType => currentEnvironment || restoreEnvironment();

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

const restoreEnvironment = (): ServerType => {
  let restoredEnvironment = settings.restore(SettingsType.ENV, ServerType.PRODUCTION);
  if (!Object.values(ServerType).includes(restoredEnvironment)) {
    restoredEnvironment = ServerType.PRODUCTION;
    setEnvironment(restoredEnvironment);
  }
  return restoredEnvironment;
};

export const setEnvironment = (env?: ServerType): void => {
  currentEnvironment = env || restoreEnvironment();
  settings.save(SettingsType.ENV, currentEnvironment);
  settings.persistToFile();
};

function getWebappUrl() {
  return customWebappUrl ?? webappEnvironments[getEnvironment()]?.url;
}

export function getAvailebleEnvironments(): AvailableEnvironment[] {
  const customEnv = customWebappUrl
    ? {
        name: customWebappUrl.replace(/^https?:\/\//, ''),
        server: ServerType.PRODUCTION,
        url: customWebappUrl,
        isActive: true,
      }
    : null;

  const baseEnvs = Object.values(webappEnvironments).map(({name, server, url}) => {
    return {
      name,
      server,
      url,
      isActive: url === getWebappUrl(),
    };
  });
  // If the app has been started with an --env flag, add this environment to the list
  return customEnv ? [customEnv, ...baseEnvs] : baseEnvs;
}

export const web = {
  getAdminUrl: (path: string = ''): string => {
    const baseUrl = isProdEnvironment ? URL_ADMIN.PRODUCTION : URL_ADMIN.STAGING;
    return `${baseUrl}${path}`;
  },
  getWebappUrl,
  getWebsiteUrl: (path: string = ''): string => {
    const baseUrl = isProdEnvironment ? URL_WEBSITE.PRODUCTION : URL_WEBSITE.STAGING;
    return `${baseUrl}${path}`;
  },
};

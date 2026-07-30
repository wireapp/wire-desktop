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
const webappUrlSetting = settings.restore<string | undefined>(SettingsType.CUSTOM_WEBAPP_URL);
const customWebappUrl: string | undefined = argv[config.ARGUMENT.ENV] || webappUrlSetting;

export enum ServerType {
  PRODUCTION = 'PRODUCTION',
  EDGE = 'EDGE',
  BETA = 'INTERNAL',
}

interface AvailableEnvironment {
  name: string;
  server?: ServerType;
  url: string;
  isActive: boolean;
}

let currentEnvironment = settings.restore<ServerType | undefined>(SettingsType.ENV);

const webappEnvironments = {
  [ServerType.PRODUCTION]: {name: 'Production', server: ServerType.PRODUCTION, url: 'https://app.wire.com'},
  [ServerType.BETA]: {name: 'Beta', server: ServerType.BETA, url: 'https://wire-webapp-beta.wire.com'},
  [ServerType.EDGE]: {name: 'Edge', server: ServerType.EDGE, url: 'https://wire-webapp-edge.wire.com'},
} as const;

export const app = {
  ENV: config.environment,
  DESKTOP_VERSION: config.version,
  IS_DEVELOPMENT: config.environment !== 'production' && config.environment !== 'wire-gov',
  IS_PRODUCTION: config.environment === 'production',
  IS_WIRE_GOV: config.environment === 'wire-gov',
  UPDATE_URL_WIN: config.updateUrl,
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

export const setEnvironment = (env: ServerType): void => {
  currentEnvironment = env;
  settings.save(SettingsType.ENV, env);
  settings.persistToFile();
};

/**
 * will return the url of the webapp.
 * For Wire Gov builds, only the custom URL from init.json (`customWebAppURL`) is honored —
 * there is no Production/Beta/Edge fallback and no build-time default.
 * Otherwise: if there is a custom url set, it will return that one,
 * else it will return the url of the current environment,
 * and if no environment is set, it will use the default value set in the config.
 * @returns {string | undefined} the url of the webapp, or undefined if none is configured
 */
function getWebappUrl() {
  if (app.IS_WIRE_GOV) {
    return customWebappUrl;
  }
  const envUrl = currentEnvironment && webappEnvironments[currentEnvironment]?.url;
  return customWebappUrl ?? envUrl ?? config.appBase;
}

/**
 * Gives all the environments that are available to the app.
 * It will add the custom url (set by the --env option) if set.
 * Wire Gov builds only ever run against the URL configured in init.json and never expose
 * a switcher, so no entries are returned for them.
 * @returns {AvailableEnvironment[]} all the environment the app can run against
 */
export function getAvailableEnvironments(): AvailableEnvironment[] {
  if (app.IS_WIRE_GOV) {
    return [];
  }

  const customEnv = customWebappUrl
    ? {
        name: customWebappUrl.replace(/^https?:\/\//, ''),
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
  getWebappUrl,
  getWebsiteUrl: (path: string = ''): string => {
    const baseUrl = config.websiteUrl;
    return `${baseUrl}${path}`;
  },
};

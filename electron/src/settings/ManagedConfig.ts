/*
 * Wire
 * Copyright (C) 2025 Wire Swiss GmbH
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

/**
 * Managed configuration (MDM) for enterprise deployment.
 * Reads from Windows Registry (Group Policy / user) or macOS system preferences;
 * validates with Joi; caches result for process lifetime. Config is loaded once
 * in the main process only; renderer receives redacted config via IPC.
 */

import {execFileSync} from 'child_process';
import * as Electron from 'electron';
import Joi from '@hapi/joi';
import {URL} from 'url';

import {getLogger} from '../logging/getLogger';
import {SettingsType} from './SettingsType';

const logger = getLogger('ManagedConfig');
const app = Electron.app || require('@electron/remote').app;
const systemPreferences = Electron.systemPreferences || require('@electron/remote').systemPreferences;

export interface ManagedConfig {
  webappUrl?: string;
  updateUrlWin?: string;
  proxyServerUrl?: string;
  disableAutoUpdate?: boolean;
  downloadPath?: string;
  enableSpellChecking?: boolean;
  showMenuBar?: boolean;
  autoLaunch?: boolean;
  locale?: string;
}

export interface ManagedConfigSource {
  platform: 'windows' | 'macos' | 'unknown';
  location?: string;
}

export interface ManagedConfigResult {
  config: ManagedConfig;
  source: ManagedConfigSource;
}

type ManagedKey = keyof ManagedConfig;
type ManagedValueType = 'string' | 'boolean';

export interface RegistryValue {
  type: string;
  value: string;
}

const MANAGED_KEYS: Record<ManagedKey, {type: ManagedValueType}> = {
  webappUrl: {type: 'string'},
  updateUrlWin: {type: 'string'},
  proxyServerUrl: {type: 'string'},
  disableAutoUpdate: {type: 'boolean'},
  downloadPath: {type: 'string'},
  enableSpellChecking: {type: 'boolean'},
  showMenuBar: {type: 'boolean'},
  autoLaunch: {type: 'boolean'},
  locale: {type: 'string'},
};

const SETTINGS_MANAGED_MAP: Partial<Record<SettingsType, ManagedKey>> = {
  [SettingsType.CUSTOM_WEBAPP_URL]: 'webappUrl',
  [SettingsType.PROXY_SERVER_URL]: 'proxyServerUrl',
  [SettingsType.DOWNLOAD_PATH]: 'downloadPath',
  [SettingsType.ENABLE_SPELL_CHECKING]: 'enableSpellChecking',
  [SettingsType.SHOW_MENU_BAR]: 'showMenuBar',
  [SettingsType.AUTO_LAUNCH]: 'autoLaunch',
  [SettingsType.LOCALE]: 'locale',
};

const managedSchema = Joi.object({
  webappUrl: Joi.string().trim().uri({scheme: ['http', 'https']}),
  updateUrlWin: Joi.string().trim().uri({scheme: ['http', 'https']}),
  proxyServerUrl: Joi.string().trim().uri({scheme: ['http', 'https', 'socks4', 'socks5']}),
  disableAutoUpdate: Joi.boolean(),
  downloadPath: Joi.string().trim().min(1),
  enableSpellChecking: Joi.boolean(),
  showMenuBar: Joi.boolean(),
  autoLaunch: Joi.boolean(),
  locale: Joi.string().trim().pattern(/^[A-Za-z]{2,3}(-[A-Za-z]{2,3})?$/),
}).unknown(false);

/**
 * Cached managed config. Loaded once on first getManagedConfig() and not refreshed until process restart.
 * MDM runtime updates (e.g. policy refresh on Windows, macOS defaults change) are not reflected until restart.
 */
let cachedConfig: ManagedConfigResult | null = null;

/** Sanitize app name for use in Windows registry key path (alphanumeric only). */
const sanitizeRegistryAppKey = (appName: string): string => {
  const raw = (appName || 'Wire').trim();
  const safe = raw.replace(/[^A-Za-z0-9]/g, '');
  return safe.length > 0 ? safe : 'Wire';
};

const toRegistryPaths = (appName: string) => {
  const registryAppKey = sanitizeRegistryAppKey(appName);
  return {
    policy: `HKCU\\Software\\Policies\\Wire\\${registryAppKey}`,
    user: `HKCU\\Software\\Wire\\${registryAppKey}`,
  };
};

export const parseRegistryNumber = (rawValue: string): number | undefined => {
  if (!rawValue) {
    return undefined;
  }
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^0x/i.test(trimmed)) {
    const parsed = parseInt(trimmed, 16);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const parseRegistryValue = (entry: RegistryValue, expectedType: ManagedValueType): string | boolean | undefined => {
  const rawValue = entry.value.trim();
  if (!rawValue) {
    return undefined;
  }
  if (expectedType === 'string') {
    return rawValue;
  }

  if (entry.type === 'REG_DWORD') {
    const numericValue = parseRegistryNumber(rawValue);
    if (typeof numericValue === 'number') {
      return numericValue !== 0;
    }
  }

  const normalized = rawValue.toLowerCase();
  if (['1', 'true', 'yes'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no'].includes(normalized)) {
    return false;
  }
  return undefined;
};

/** Queries a single Windows registry key. keyPath must be built from sanitizeRegistryAppKey to avoid injection. */
const queryRegistryKey = (keyPath: string): Record<string, RegistryValue> => {
  try {
    const output = execFileSync('reg', ['query', keyPath], {encoding: 'utf8'});
    const values: Record<string, RegistryValue> = {};

    for (const line of output.split(/\r?\n/)) {
      const match = line.match(/^\s*([^\s]+)\s+(REG_\w+)\s+(.*)$/);
      if (!match) {
        continue;
      }
      const [, name, type, value] = match;
      values[name] = {type, value};
    }

    return values;
  } catch (error) {
    return {};
  }
};

/** Reads managed config from Windows Registry (policy then user). keyPath is built from sanitized app name. */
const readWindowsRegistryConfig = (): {rawConfig: Record<string, unknown>; source: ManagedConfigSource} => {
  const appName = app?.getName?.() || 'Wire';
  const registryPaths = toRegistryPaths(appName);
  const policyValues = queryRegistryKey(registryPaths.policy);
  const userValues = queryRegistryKey(registryPaths.user);
  const rawConfig: Record<string, unknown> = {};
  const usedLocations = new Set<string>();

  (Object.keys(MANAGED_KEYS) as ManagedKey[]).forEach(key => {
    const expectedType = MANAGED_KEYS[key].type;
    const policyEntry = policyValues[key];
    const userEntry = userValues[key];
    const entry = policyEntry || userEntry;

    if (!entry) {
      return;
    }

    const parsedValue = parseRegistryValue(entry, expectedType);
    if (typeof parsedValue === 'undefined') {
      logger.warn(`Ignoring registry value "${key}" due to invalid format.`);
      if (policyEntry) {
        usedLocations.add(registryPaths.policy);
      } else if (userEntry) {
        usedLocations.add(registryPaths.user);
      }
      return;
    }

    rawConfig[key] = parsedValue;
    if (policyEntry) {
      usedLocations.add(registryPaths.policy);
    } else if (userEntry) {
      usedLocations.add(registryPaths.user);
    }
  });

  return {
    rawConfig,
    source: {
      platform: 'windows',
      location: Array.from(usedLocations).join(', ') || registryPaths.policy,
    },
  };
};

/** Reads managed config from macOS system preferences (CFPreferences / getUserDefault). */
const readMacManagedConfig = (): {rawConfig: Record<string, unknown>; source: ManagedConfigSource} => {
  const rawConfig: Record<string, unknown> = {};

  if (!systemPreferences?.getUserDefault) {
    return {
      rawConfig,
      source: {platform: 'macos', location: app?.getName?.()},
    };
  }

  (Object.keys(MANAGED_KEYS) as ManagedKey[]).forEach(key => {
    const expectedType = MANAGED_KEYS[key].type;
    const prefType = expectedType === 'boolean' ? 'boolean' : 'string';
    const value = systemPreferences.getUserDefault(key, prefType);
    if (value === null || typeof value === 'undefined') {
      return;
    }
    rawConfig[key] = value;
  });

  return {
    rawConfig,
    source: {
      platform: 'macos',
      location: app?.getName?.(),
    },
  };
};

/** Validates and normalizes raw config; strips unknown keys and invalid values. Safe to call with untrusted input. */
export const normalizeManagedConfig = (rawConfig: Record<string, unknown>, source: ManagedConfigSource): ManagedConfigResult => {
  const validation = managedSchema.validate(rawConfig, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  const config = {...validation.value} as ManagedConfig;
  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      delete (config as Record<string, unknown>)[key];
    }
  });

  if (validation.error) {
    const invalidKeys = new Set(validation.error.details.map(detail => String(detail.path[0])));
    invalidKeys.forEach(key => {
      logger.warn(`Ignoring managed config "${key}" due to validation failure.`);
    });
  }

  const configKeys = Object.keys(config);
  if (configKeys.length > 0) {
    logger.info(`Loaded managed config keys: ${configKeys.join(', ')}.`);
  }

  return {config, source};
};

const loadManagedConfig = (): ManagedConfigResult => {
  if (process.platform === 'win32') {
    const {rawConfig, source} = readWindowsRegistryConfig();
    return normalizeManagedConfig(rawConfig, source);
  }

  if (process.platform === 'darwin') {
    const {rawConfig, source} = readMacManagedConfig();
    return normalizeManagedConfig(rawConfig, source);
  }

  return {
    config: {},
    source: {platform: 'unknown'},
  };
};

/**
 * Removes username and password from a proxy URL. Use before exposing config to the renderer
 * so proxy credentials are never sent to untrusted context.
 */
export const redactProxyCredentials = (proxyServerUrl: string): string => {
  try {
    const parsed = new URL(proxyServerUrl);
    if (parsed.username || parsed.password) {
      parsed.username = '';
      parsed.password = '';
      return parsed.toString();
    }
  } catch (error) {
    return proxyServerUrl;
  }
  return proxyServerUrl;
};

/**
 * Returns the current managed config. Loaded once and cached for process lifetime (no hot reload).
 * @param override - Test-only: when provided, used as the config and cached so subsequent callers see it.
 */
export const getManagedConfig = (override?: ManagedConfigResult): ManagedConfigResult => {
  if (override !== undefined) {
    cachedConfig = override;
    return override;
  }
  if (!cachedConfig) {
    cachedConfig = loadManagedConfig();
  }
  return cachedConfig;
};

/** Returns config safe for renderer: proxy URL is redacted so credentials are never exposed. */
export const getManagedConfigForRenderer = (): ManagedConfig => {
  const {config} = getManagedConfig();
  if (!config.proxyServerUrl) {
    return config;
  }
  return {
    ...config,
    proxyServerUrl: redactProxyCredentials(config.proxyServerUrl),
  };
};

export const getManagedSettingOverride = <T>(settingType: SettingsType): T | undefined => {
  const managedKey = SETTINGS_MANAGED_MAP[settingType];
  if (!managedKey) {
    return undefined;
  }
  const {config} = getManagedConfig();
  const value = config[managedKey];
  return typeof value === 'undefined' ? undefined : (value as T);
};

export const isSettingManaged = (settingType: SettingsType): boolean => {
  const managedKey = SETTINGS_MANAGED_MAP[settingType];
  if (!managedKey) {
    return false;
  }
  const {config} = getManagedConfig();
  return Object.prototype.hasOwnProperty.call(config, managedKey);
};

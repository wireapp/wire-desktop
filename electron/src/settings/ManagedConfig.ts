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

import Joi from '@hapi/joi';
import * as Electron from 'electron';

import {execFileSync} from 'child_process';
import * as path from 'path';
import {URL} from 'url';

import {SettingsType} from './SettingsType';

import {getLogger} from '../logging/getLogger';

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
  webappUrl: Joi.string()
    .trim()
    .uri({scheme: ['http', 'https']}),
  updateUrlWin: Joi.string()
    .trim()
    .uri({scheme: ['http', 'https']}),
  proxyServerUrl: Joi.string()
    .trim()
    .uri({scheme: ['http', 'https', 'socks4', 'socks5']}),
  disableAutoUpdate: Joi.boolean(),
  downloadPath: Joi.string().trim().min(1),
  enableSpellChecking: Joi.boolean(),
  showMenuBar: Joi.boolean(),
  autoLaunch: Joi.boolean(),
  locale: Joi.string()
    .trim()
    .pattern(/^[A-Za-z]{2,3}(-[A-Za-z]{2,3})?$/),
}).unknown(false);

/**
 * Cached managed config. Loaded once on first getManagedConfig() and not refreshed until process restart.
 * MDM runtime updates (e.g. policy refresh on Windows, macOS defaults change) are not reflected until restart.
 */
let cachedConfig: ManagedConfigResult | null = null;

/**
 * Sanitize app name for use in Windows registry key path (alphanumeric only).
 * @param {string} appName - Application name from app.getName().
 * @returns {string} Safe string for use in registry path.
 */
const sanitizeRegistryAppKey = (appName: string): string => {
  const raw = (appName || 'Wire').trim();
  const safe = raw.replace(/[^A-Za-z0-9]/g, '');
  return safe.length > 0 ? safe : 'Wire';
};

/**
 * Build policy and user registry key paths for the app.
 * @param {string} appName - Application name from app.getName().
 * @returns {Object} Object with policy and user key paths.
 */
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

export const parseRegistryValue = (
  entry: RegistryValue,
  expectedType: ManagedValueType,
): string | boolean | undefined => {
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

/**
 * Full path to reg.exe so we do not depend on PATH (avoids running a substituted binary).
 * @returns {string} Absolute path to reg.exe.
 */
const getRegExePath = (): string => path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'reg.exe');

/**
 * Queries a single Windows registry key. keyPath must be built from sanitizeRegistryAppKey to avoid injection.
 * @param {string} keyPath - Registry path (e.g. HKCU\\Software\\Policies\\Wire\\Wire).
 * @returns {Record<string, RegistryValue>} Map of value name to { type, value }.
 */
const queryRegistryKey = (keyPath: string): Record<string, RegistryValue> => {
  try {
    const output = execFileSync(getRegExePath(), ['query', keyPath], {encoding: 'utf8'});
    const values: Record<string, RegistryValue> = {};

    for (const line of output.split(/\r?\n/)) {
      // Match name and type only; take rest of line as value to avoid ReDoS from (.*)$ backtracking.
      const prefixMatch = line.match(/^\s*([^\s]+)\s+(REG_\w+)\s+/);
      if (!prefixMatch) {
        continue;
      }
      const name = prefixMatch[1];
      const type = prefixMatch[2];
      const value = line.slice(prefixMatch[0].length).trim();
      values[name] = {type, value};
    }

    return values;
  } catch (error) {
    return {};
  }
};

/**
 * Reads managed config from Windows Registry (policy then user). keyPath is built from sanitized app name.
 * @returns {Object} Raw config and source metadata.
 */
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

/**
 * Reads managed config from macOS system preferences (CFPreferences / getUserDefault).
 * @returns {Object} Raw config and source.
 */
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

/**
 * Validates and normalizes raw config; strips unknown keys and invalid values. Safe to call with untrusted input.
 * @param {Record<string, unknown>} rawConfig - Raw key-value map from registry or macOS preferences.
 * @param {ManagedConfigSource} source - Source metadata (platform, location).
 * @returns {ManagedConfigResult} Validated config and source.
 */
export const normalizeManagedConfig = (
  rawConfig: Record<string, unknown>,
  source: ManagedConfigSource,
): ManagedConfigResult => {
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

/**
 * Loads managed config from OS (Windows Registry or macOS preferences).
 * @returns {ManagedConfigResult} Validated config and source, or empty config on unsupported platform.
 */
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
 * @param {string} proxyServerUrl - Proxy URL (may contain user:password).
 * @returns {string} URL with credentials stripped, or original if invalid.
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
 * @param {ManagedConfigResult} [override] - Test-only: when provided, used as the config and cached.
 * @returns {ManagedConfigResult} Current managed config and source.
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

/**
 * Returns config safe for renderer: proxy URL is redacted so credentials are never exposed.
 * @returns {ManagedConfig} Managed config with proxy credentials stripped.
 */
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

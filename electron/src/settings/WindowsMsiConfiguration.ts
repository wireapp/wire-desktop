/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

const WEBAPP_URL_VALUE = 'WebAppUrl';

interface RegistryValue {
  name: string;
  data: unknown;
}

export interface WindowsRegistry {
  HKEY: {HKEY_LOCAL_MACHINE: unknown};
  enumerateValues: (hive: unknown, subkey: string) => ReadonlyArray<RegistryValue>;
}

export interface WindowsMsiWebAppConfiguration {
  isConfigured: boolean;
  issue?: 'invalid-registry-type' | 'invalid-url' | 'registry-read-failed' | 'registry-unavailable';
  url?: string;
}

function loadRegistry(): WindowsRegistry | undefined {
  try {
    // Native and Windows-only. Loading lazily keeps it out of non-Windows runtime paths.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('registry-js');
  } catch {
    return undefined;
  }
}

function registryKey(productName: string): string {
  return `SOFTWARE\\Wire\\${productName}`;
}

export function getWindowsMsiWebAppConfiguration(
  productName: string,
  registry: WindowsRegistry | undefined = loadRegistry(),
): WindowsMsiWebAppConfiguration {
  if (!registry) {
    return {isConfigured: false, issue: 'registry-unavailable'};
  }

  let value: RegistryValue | undefined;
  try {
    value = registry
      .enumerateValues(registry.HKEY.HKEY_LOCAL_MACHINE, registryKey(productName))
      .find(entry => entry.name.toLowerCase() === WEBAPP_URL_VALUE.toLowerCase());
  } catch {
    return {isConfigured: false, issue: 'registry-read-failed'};
  }

  if (!value || (typeof value.data === 'string' && value.data.trim() === '')) {
    return {isConfigured: false};
  }
  if (typeof value.data !== 'string') {
    return {isConfigured: true, issue: 'invalid-registry-type'};
  }

  try {
    const url = new URL(value.data.trim());
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('Only credential-free HTTPS URLs are allowed.');
    }
    return {isConfigured: true, url: url.toString()};
  } catch {
    return {isConfigured: true, issue: 'invalid-url'};
  }
}

export function selectWebAppUrlOverride(
  msiConfiguration: WindowsMsiWebAppConfiguration,
  commandLineUrl?: string,
  perUserUrl?: string,
): string | undefined {
  if (msiConfiguration.isConfigured) {
    return msiConfiguration.url;
  }
  return commandLineUrl || perUserUrl;
}

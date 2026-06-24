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

import {getLogger} from '../../logging/getLogger';
import {
  MANAGED_VALUE_NAME,
  WINDOWS_CLOUD_DOMAIN_JOIN_KEY,
  WINDOWS_ENROLLMENTS_KEY,
  WINDOWS_POLICY_KEY,
} from '../constants';

const logger = getLogger('ManagedConfig/windows');

/**
 * Minimal local typing for `registry-js`. The dependency is a Windows-only native module, so it is
 * required lazily (below) rather than imported at the top level: this keeps it out of type-checking
 * and out of the macOS/Linux runtime, where it is neither installed nor loadable.
 */
interface RegistryValue {
  name: string;
  type: string;
  data: unknown;
}
interface RegistryJs {
  HKEY: {HKEY_CURRENT_USER: number; HKEY_LOCAL_MACHINE: number};
  enumerateKeys: (hive: number, subkey: string) => string[];
  enumerateValues: (hive: number, subkey: string) => RegistryValue[];
}

function loadRegistry(): RegistryJs | undefined {
  try {
    // Native, Windows-only. Reads the registry via the Win32 API directly — no process spawn / no shell.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('registry-js');
  } catch (error) {
    logger.warn('registry-js is unavailable, treating the device as unmanaged:', error);
    return undefined;
  }
}

function valuesOf(registry: RegistryJs, hive: number, subkey: string): RegistryValue[] {
  try {
    return registry.enumerateValues(hive, subkey) ?? [];
  } catch {
    return [];
  }
}

function subkeysOf(registry: RegistryJs, hive: number, subkey: string): string[] {
  try {
    return registry.enumerateKeys(hive, subkey) ?? [];
  } catch {
    return [];
  }
}

// Treats `1` (REG_DWORD) and `"1"`/`"true"` (REG_SZ) as the enabled managed flag.
function isManagedFlagEnabled(value: RegistryValue): boolean {
  if (value.name !== MANAGED_VALUE_NAME) {
    return false;
  }
  const {data} = value;
  return data === 1 || data === true || data === '1' || (typeof data === 'string' && data.toLowerCase() === 'true');
}

// True when an organization has set the managed flag via Group Policy (machine-wide or per-user).
function hasWirePolicyPayload(registry: RegistryJs): boolean {
  const {HKEY} = registry;
  return [HKEY.HKEY_LOCAL_MACHINE, HKEY.HKEY_CURRENT_USER].some(hive =>
    valuesOf(registry, hive, WINDOWS_POLICY_KEY).some(isManagedFlagEnabled),
  );
}

// True when the device is MDM-enrolled or Azure AD / Entra joined.
function isDeviceEnrolled(registry: RegistryJs): boolean {
  const {HKEY} = registry;

  const isMdmEnrolled = subkeysOf(registry, HKEY.HKEY_LOCAL_MACHINE, WINDOWS_ENROLLMENTS_KEY).some(enrollmentKey => {
    const values = valuesOf(registry, HKEY.HKEY_LOCAL_MACHINE, `${WINDOWS_ENROLLMENTS_KEY}\\${enrollmentKey}`);
    return values.some(({name}) => name === 'UPN' || name === 'ProviderID');
  });
  if (isMdmEnrolled) {
    return true;
  }

  return subkeysOf(registry, HKEY.HKEY_LOCAL_MACHINE, WINDOWS_CLOUD_DOMAIN_JOIN_KEY).length > 0;
}

export function isDeviceManagedWindows(): boolean {
  const registry = loadRegistry();
  if (!registry) {
    return false;
  }
  return hasWirePolicyPayload(registry) || isDeviceEnrolled(registry);
}

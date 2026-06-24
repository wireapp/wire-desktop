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

import {isDeviceManagedLinux} from './backends/linux';
import {isDeviceManagedMacOS} from './backends/macos';
import {isDeviceManagedWindows} from './backends/windows';

import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';

const logger = getLogger('ManagedConfig');

/**
 * The single, OS-independent signal the desktop forwards to the webapp. The webapp owns App-lock
 * enforcement; the desktop only reports whether the device is company-managed.
 */
export interface ManagedConfig {
  isManaged: boolean;
}

let cached: ManagedConfig | undefined;

function detectIsManaged(): boolean {
  if (EnvironmentUtil.platform.IS_WINDOWS) {
    return isDeviceManagedWindows();
  }
  if (EnvironmentUtil.platform.IS_MAC_OS) {
    return isDeviceManagedMacOS();
  }
  if (EnvironmentUtil.platform.IS_LINUX) {
    return isDeviceManagedLinux();
  }
  return false;
}

// Reads the managed-device status once, then memoizes it: MDM config is static for an app session
// (a relaunch is required to pick up a re-push). Never throws — any failure is treated as unmanaged
// so non-managed devices and existing on-prem deployments are unaffected.
export function getManagedConfig(): ManagedConfig {
  if (!cached) {
    let isManaged = false;
    try {
      isManaged = detectIsManaged();
    } catch (error) {
      logger.warn('Failed to read managed device configuration, treating the device as unmanaged:', error);
    }
    cached = {isManaged};
    logger.info(`Managed device detection: isManaged=${isManaged}`);
  }
  return cached;
}

// Clears the memoized result. Primarily for tests; managed status is otherwise stable per session.
export function clearManagedConfigCache(): void {
  cached = undefined;
}

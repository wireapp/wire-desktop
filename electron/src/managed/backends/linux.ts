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

import * as fs from 'fs-extra';

import {getLogger} from '../../logging/getLogger';
import {APPLOCK_OVERRIDE_KEY, LINUX_MANAGED_CONFIG_PATH} from '../constants';

const logger = getLogger('ManagedConfig/linux');

// Linux has no standard MDM enrollment API, so managed status is driven by the presence of a
// machine-wide managed config file placed by the organization. The file's presence means managed,
// unless it explicitly opts out with `{"applockOverride": false}`. A missing/unreadable file means unmanaged.
export function isDeviceManagedLinux(): boolean {
  try {
    const managedConfig = fs.readJSONSync(LINUX_MANAGED_CONFIG_PATH);
    return managedConfig?.[APPLOCK_OVERRIDE_KEY] !== false;
  } catch {
    // Missing file is the normal unmanaged path; only log genuine parse errors.
    if (fs.pathExistsSync(LINUX_MANAGED_CONFIG_PATH)) {
      logger.warn(`Failed to parse ${LINUX_MANAGED_CONFIG_PATH}, treating the device as unmanaged.`);
    }
    return false;
  }
}

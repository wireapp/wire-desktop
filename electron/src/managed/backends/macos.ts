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

import {systemPreferences} from 'electron';

import {getLogger} from '../../logging/getLogger';
import {APPLOCK_OVERRIDE_KEY} from '../constants';

const logger = getLogger('ManagedConfig/macos');

// macOS does not expose MDM enrollment status without a shell tool (`profiles`), which is disallowed,
// and Electron has no enrollment API. So managed status is driven by the MDM-pushed managed app
// preference — the standard MDM AppConfig mechanism. `getUserDefault` reads it natively from the app's
// own defaults domain (no shell), returning `false` when the preference is not set.
export function isDeviceManagedMacOS(): boolean {
  try {
    return systemPreferences.getUserDefault(APPLOCK_OVERRIDE_KEY, 'boolean') === true;
  } catch (error) {
    logger.warn('Failed to read managed preference, treating the device as unmanaged:', error);
    return false;
  }
}

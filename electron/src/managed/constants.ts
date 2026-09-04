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

/**
 * Locations the desktop app reads to decide whether the App-lock override is enforced.
 *
 * These are organization-agnostic, Wire-vendor locations: no specific customer/company
 * name is encoded. Any organization's MDM writes the managed payload into these standard
 * Wire locations, so the feature ships once and works for every organization.
 *
 * NOTE: the exact key/value names below should be confirmed with the MDM and mobile/webapp
 * teams so all platforms read the same MDM payload convention.
 */

/** The App-lock override flag an organization sets to `true`/`1`. Same name across all platforms. */
export const APPLOCK_OVERRIDE_KEY = 'applockOverride';

/** Windows: machine-wide Group Policy key. The `APPLOCK_OVERRIDE_KEY` value under it drives the override. */
export const WINDOWS_POLICY_KEY = 'SOFTWARE\\Policies\\Wire';

// macOS reads `APPLOCK_OVERRIDE_KEY` from the app's defaults domain (pushed via an MDM AppConfig profile).

/** Linux: machine-wide managed config file holding the `APPLOCK_OVERRIDE_KEY` flag. */
export const LINUX_MANAGED_CONFIG_PATH = '/etc/wire/managed.json';

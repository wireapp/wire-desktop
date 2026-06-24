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
 * Locations the desktop app reads to decide whether the device is company-managed.
 *
 * These are organization-agnostic, Wire-vendor locations: no specific customer/company
 * name is encoded. Any organization's MDM writes the managed payload into these standard
 * Wire locations, so the feature ships once and works for every organization.
 *
 * NOTE: the exact key/value names below should be confirmed with the MDM and mobile/webapp
 * teams so all platforms read the same MDM payload convention.
 */

/** The managed flag an organization sets to `true`/`1`. Same name across all platforms for consistency. */
export const MANAGED_VALUE_NAME = 'isManaged';

/** Windows: machine-wide Group Policy key. The `MANAGED_VALUE_NAME` value under it drives managed status. */
export const WINDOWS_POLICY_KEY = 'SOFTWARE\\Policies\\Wire';

/** Windows: MDM enrollment registry. A subkey carrying a `UPN`/`ProviderID` means the device is enrolled. */
export const WINDOWS_ENROLLMENTS_KEY = 'SOFTWARE\\Microsoft\\Enrollments';

/** Windows: Azure AD / Entra device join. A subkey under JoinInfo means the device is joined. */
export const WINDOWS_CLOUD_DOMAIN_JOIN_KEY = 'SYSTEM\\CurrentControlSet\\Control\\CloudDomainJoin\\JoinInfo';

// macOS reads `MANAGED_VALUE_NAME` from the app's defaults domain (pushed via an MDM AppConfig profile).

/** Linux: machine-wide managed config file holding the `MANAGED_VALUE_NAME` flag. */
export const LINUX_MANAGED_CONFIG_PATH = '/etc/wire/managed.json';

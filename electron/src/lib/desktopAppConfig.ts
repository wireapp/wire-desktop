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

import type {ManagedConfig} from '../managed/ManagedConfig';

export type DesktopAppConfig = {
  readonly version: string;
  readonly regionalLocale?: string;
  readonly supportsCallingPopoutWindow?: boolean;
  readonly supportsWebViewRefresh?: boolean;
  readonly managedConfig?: ManagedConfig;
};

type CreateDesktopAppConfigOptions = {
  readonly managedConfig: ManagedConfig;
  readonly regionalLocale?: string;
  readonly version: string;
};

export function createDesktopAppConfig(options: CreateDesktopAppConfigOptions): DesktopAppConfig {
  const {managedConfig, regionalLocale, version} = options;

  return {
    version,
    regionalLocale,
    supportsCallingPopoutWindow: true,
    supportsWebViewRefresh: true,
    managedConfig,
  };
}

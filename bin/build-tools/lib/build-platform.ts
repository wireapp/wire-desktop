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
 */

export type BuildPlatform = 'windows' | 'windows-installer' | 'windows-msi' | 'windows-msi-alias' | 'macos';

export function normalizeBuildPlatform(platform: string): BuildPlatform | undefined {
  switch (platform) {
    case 'win':
    case 'windows':
      return 'windows';
    case 'windows-installer':
    case 'windows-msi':
    case 'windows-msi-alias':
      return platform;
    case 'mac':
    case 'macos':
      return 'macos';
    default:
      return undefined;
  }
}

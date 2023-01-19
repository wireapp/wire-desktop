/*
 * Wire
 * Copyright (C) 2023 Wire Swiss GmbH
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

import {shell} from 'electron';
import fs from 'fs-extra';

export function createShortcuts(locations: string[], execPath: string, appUserModelId: string) {
  // As documented in https://github.com/electron/windows-installer/issues/296,
  // Squirrel has problems with notification clicks on Windows 10.
  // The easiest workaround is to create shortcuts on our own.
  locations.forEach(location => {
    shell.writeShortcutLink(location, {
      appUserModelId: appUserModelId,
      target: execPath,
    });
  });
}

export async function removeShortcuts(shortcutPaths: string[]) {
  return Promise.all(shortcutPaths.map(shortcutPath => fs.remove(shortcutPath)));
}

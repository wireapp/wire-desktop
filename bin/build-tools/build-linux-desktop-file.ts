/*
 * Wire
 * Copyright (C) 2021 Wire Swiss GmbH
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

import {buildLinuxConfig} from './lib/build-linux';
const pkg = require('../../package.json');

void (async () => {
  try {
    const config = await buildLinuxConfig();
    const desktopConfig = config.builderConfig.deb?.desktop;

    // Initialize entry if it doesn't exist
    if (!desktopConfig?.entry) {
      if (desktopConfig) {
        desktopConfig.entry = {};
      } else {
        console.error('desktopConfig is null or undefined');
        process.exit(1);
      }
    }

    // Set properties in the entry object
    desktopConfig.entry.Comment = pkg.description;
    desktopConfig.entry.Exec = `${pkg.name} %U`;
    desktopConfig.entry.Icon = pkg.name;
    desktopConfig.entry.Terminal = 'false';
    desktopConfig.entry.Type = 'Application';

    const formattedEntry = Object.entries(desktopConfig.entry)
      .map(([key, value]) => `${key}=${value}`)
      .sort((entryA, entryB) => entryA.localeCompare(entryB))
      .join('\n');
    console.info(`[Desktop Entry]\n${formattedEntry}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

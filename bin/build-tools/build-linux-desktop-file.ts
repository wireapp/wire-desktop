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
    desktopConfig.Comment = pkg.description;
    desktopConfig.Exec = `${pkg.name} %U`;
    desktopConfig.Icon = pkg.name;
    desktopConfig.Terminal = false;
    desktopConfig.Type = 'Application';
    const formattedEntry = Object.entries(desktopConfig)
      .map(([key, value]) => `${key}=${value}`)
      .sort((entryA, entryB) => entryA.localeCompare(entryB))
      .join('\n');
    console.info(`[Desktop Entry]\n${formattedEntry}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

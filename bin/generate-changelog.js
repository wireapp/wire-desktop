#!/usr/bin/env node

/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

const {generate} = require('generate-changelog');
const minimist = require('minimist');
const {exec} = require('child_process');
const {promisify} = require('util');
const electronReleases = require('electron-releases/lite.json');

const execAsync = promisify(exec);
const electronVersion = require('../package.json').devDependencies.electron;
const argv = minimist(process.argv.slice(1));

const getDate = () => {
  const pad = str => str.toString().padStart(2, '0');
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getChromeVersion = () => {
  const electronRelease = electronReleases.find(({version}) => version === electronVersion);
  if (electronRelease) {
    return electronRelease.deps.chrome;
  }

  return 'Unknown';
};

const getLatestTag = async platform => {
  const command = `git describe --abbrev=0 --tags${platform ? ` --match="${platform}/*"` : ''}`;
  const {stderr, stdout} = await execAsync(command);
  if (stderr) {
    throw stderr;
  }
  return stdout.toString().trim();
};

let platform = '';
let platformName = '';

if (argv.linux) {
  platform = 'linux';
  platformName = 'Linux';
}

if (argv.windows) {
  platform = 'windows';
  platformName = 'Windows';
}

if (argv.macos) {
  platform = 'macos';
  platformName = 'macOS';
}

if (!platform) {
  console.error('Error: No platform defined. Example: generate-changelog.js --windows');
  process.exit(1);
}

(async () => {
  const tag = await getLatestTag(platform);
  let log = await generate({exclude: ['build', 'chore', 'runfix'], tag});
  log = log.replace(/#+ [\d]+.*/, '').trim();
  log =
    `### Release Notes\n\n${log}\n\n` +
    `### Versions\n\n` +
    `Electron ${electronVersion}\n` +
    `Chrome ${getChromeVersion()}\n\n` +
    `### Public Release Date\n\n` +
    `${getDate()}\n\n` +
    `### Changelog\n\n` +
    `[${platformName}](https://github.com/wireapp/wire-desktop/compare/${tag}...master)`;

  console.log(log);
})();

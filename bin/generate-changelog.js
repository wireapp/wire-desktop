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

//@ts-check

const {exec} = require('child_process');
const {promisify} = require('util');
const path = require('path');

const minimist = require('minimist');
const {generate: generateChangelog} = require('generate-changelog');

//@ts-ignore
const electronReleases = require('electron-releases/lite.json');
//@ts-ignore
const {electron: electronVersion} = require('../package.json').devDependencies;
const execAsync = promisify(exec);
const argv = minimist(process.argv.slice(1));
const toolname = path.basename(__filename);

const getDate = () => {
  const pad = str => str.toString().padStart(2, '0');
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getChromeVersion = () => {
  const electronRelease = electronReleases.find(({version}) => version === electronVersion);
  return electronRelease ? electronRelease.deps.chrome : 'Unknown';
};

const getTagRange = async platform => {
  const latestTagCommand = `git describe --abbrev=0 --tags --match="${platform}/*"`;
  const {stderr: errLatest, stdout: latestTag} = await execAsync(latestTagCommand);
  if (errLatest) {
    throw new Error(errLatest);
  }

  const previousTagCommant = `${latestTagCommand} "${latestTag.trim()}^"`;
  const {stderr: errPrevious, stdout: previousTag} = await execAsync(previousTagCommant);
  if (errPrevious) {
    throw new Error(errPrevious);
  }

  return {latestTag: latestTag.trim(), previousTag: previousTag.trim()};
};

let platform = '';

switch (true) {
  case !!argv.linux:
    platform = 'Linux';
    break;
  case argv.windows:
    platform = 'Windows';
    break;
  case !!argv.macos:
    platform = 'macOS';
    break;
  default:
    console.error(`Error: No or invalid platform defined. Use ${toolname} --{linux,macos,windows}`);
    process.exit(1);
}

(async () => {
  try {
    const {latestTag, previousTag} = await getTagRange(platform.toLowerCase());
    let log = await generateChangelog({exclude: ['build', 'chore', 'runfix'], tag: previousTag});
    log = log.replace(/#+ [\d]+.*/, '').trim();
    log =
      `### Release Notes\n\n${log}\n\n` +
      `### Versions\n\n` +
      `Electron ${electronVersion}\n` +
      `Chrome ${getChromeVersion()}\n\n` +
      `### Public Release Date\n\n` +
      `${getDate()}\n\n` +
      `### Changelog\n\n` +
      `[${platform}](https://github.com/wireapp/wire-desktop/compare/${previousTag}...${latestTag})`;

    console.log(log);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

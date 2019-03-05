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

const execAsync = promisify(exec);
const argv = minimist(process.argv.slice(1));

const getLatestTag = async platform => {
  const command = `git describe --abbrev=0 --tags${platform ? ` --match="${platform}/*"` : ''}`;
  const {stderr, stdout} = await execAsync(command);
  if (stderr) {
    throw stderr;
  }
  return stdout.toString().replace(/[\n\r]/, '');
};

let platform = '';

if (argv.linux) {
  platform = 'linux';
}

if (argv.windows) {
  platform = 'windows';
}

if (argv.macos) {
  platform = 'macos';
}

getLatestTag(platform)
  .then(tag => generate({exclude: ['build', 'runfix'], tag}))
  .then(console.log)
  .catch(console.error);

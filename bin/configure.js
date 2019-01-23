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

/* eslint-disable no-console */

const fs = require('fs-extra');
const {execSync} = require('child_process');
const {dirname, join, resolve} = require('path');
const pkg = require('../package');

const [defaultGitConfigurationUrl, defaultGitConfigurationVersion] = pkg.dependencies['wire-web-config-default'].split(
  '#'
);
const gitConfigurationUrl = process.env.WIRE_CONFIGURATION_REPOSITORY || defaultGitConfigurationUrl;
const gitConfigurationVersion = process.env.WIRE_CONFIGURATION_REPOSITORY_VERSION || defaultGitConfigurationVersion;

console.log(
  `Loading configuration version "${gitConfigurationVersion}" for project "${pkg.name}" from "${gitConfigurationUrl}"`
);

const configDirName = 'config';
const configDir = resolve(configDirName);
const configSrc = resolve(configDir, pkg.name, 'content');
const configDest = resolve('.');

const files = [
  {'image/logo/32x32.png': 'resources/icons/32x32.png'},
  {'image/logo/256x256.png': ['resources/icons/256x256.png', 'electron/img/wire.256.png']},
  {'image/logo/wire.icns': 'resources/macos/wire.icns'},
  {'image/logo/wire.ico': 'electron/img/wire.ico'},
];

console.log(`Cleaning config directory "${configDir}" ...`);

fs.removeSync(configDir);

console.log(`Cloning config repository ...`);

execSync(`git clone --depth 1 -b ${gitConfigurationVersion} ${gitConfigurationUrl} ${configDirName}`, {
  stdio: [0, 1],
});

files.forEach(file => {
  const copyFile = (source, destination) => {
    source = join(configSrc, source);
    destination = join(configDest, destination);

    console.log(`Copying file "${source}" -> "${destination}"`);

    fs.mkdirpSync(dirname(destination));
    fs.copySync(source, destination);
  };

  const fileSource = Object.keys(file)[0];
  const fileDestination = file[fileSource];

  if (fileDestination instanceof Array) {
    fileDestination.forEach(destination => copyFile(fileSource, destination));
  } else {
    copyFile(fileSource, fileDestination);
  }
});

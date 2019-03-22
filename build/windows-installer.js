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

const path = require('path');
const {createWindowsInstaller} = require('electron-winstaller');
const {commonConfig} = require('./common');

/** @type {import('./Config').WindowsConfig} */
const windowsDefaultConfig = {
  installerIconUrl: 'https://wire-app.wire.com/win/internal/wire.internal.ico',
  loadingGif: 'electron/img/logo.256.png',
  updateUrl: 'https://wire-app.wire.com/win/internal/',
};

/** @type {import('./Config').WindowsConfig} */
const windowsConfig = {
  ...windowsDefaultConfig,
  installerIconUrl: process.env.WIN_URL_ICON_INSTALLER || windowsDefaultConfig.installerIconUrl,
  updateUrl: process.env.WIN_URL_UPDATE || windowsDefaultConfig.updateUrl,
};

/** @type {import('electron-winstaller').Options} */
const wInstallerOptions = {
  appDirectory: `wrap/build/${commonConfig.name}-win32-ia32`,
  authors: commonConfig.name,
  description: commonConfig.description,
  iconUrl: windowsConfig.installerIconUrl,
  loadingGif: 'electron/img/logo.256.png',
  noMsi: true,
  outputDirectory: 'wrap/dist',
  setupExe: `${commonConfig.name}-Setup.exe`,
  setupIcon: 'electron/img/logo.ico',
  title: commonConfig.name,
  version: commonConfig.version.replace(/-.*$/, ''),
};

console.info(`Building ${commonConfig.name} Installer for Windows ...`);

createWindowsInstaller(wInstallerOptions)
  .then(() => console.log(`Built installer in "${path.resolve(wInstallerOptions.outputDirectory)}"`))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

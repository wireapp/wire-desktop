/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

const {app} = require('electron');
const environment = require('./environment');
const minimist = require('minimist');
const path = require('path');

const argv = minimist(process.argv.slice(1));

const addLinuxWorkarounds = () => {
  if (environment.platform.IS_LINUX) {
    // Fix indicator icon on Unity
    // Source: https://bugs.launchpad.net/ubuntu/+bug/1559249
    const isUbuntuUnity = process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('Unity');
    const isPopOS = process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('pop');
    const isGnome = process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('GNOME');
    if (isUbuntuUnity || isPopOS || isGnome) {
      process.env.XDG_CURRENT_DESKTOP = 'Unity';
    }

    // https://github.com/electron/electron/issues/13415
    app.disableHardwareAcceleration();
  }
};

const handlePortableFlags = () => {
  if (argv.portable || argv.user_data_dir) {
    const USER_PATH = argv.user_data_dir || path.join(process.env.APPIMAGE || process.execPath, '..', 'Data');

    console.log(`Saving user data to ${USER_PATH}`);
    app.setPath('userData', USER_PATH);
  }
};

const ignoreCertificateErrors = () => {
  if (environment.app.IS_DEVELOPMENT) {
    app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
  }
};

module.exports = {
  addLinuxWorkarounds,
  handlePortableFlags,
  ignoreCertificateErrors,
};

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

/** @typedef {import('@wireapp/copy-config').CopyConfigOptions} CopyConfigOptions */

//@ts-ignore
const pkg = require('./package.json');

const contentSource = 'wire-desktop/content';
const imageSource = `${contentSource}/image`;
const macOsSource = `${contentSource}/macos`;

const configurationEntry = `wire-web-config-${process.env.APP_ENV !== 'internal' ? 'production' : 'internal'}`;
const repositoryUrl = pkg.devDependencies[configurationEntry];

/** @type {CopyConfigOptions} */
const options = {
  files: {
    [`${imageSource}/**`]: 'electron/img/',
    [`${macOsSource}/**`]: 'resources/macos/',
    [`${imageSource}/logo/256x256.png`]: ['resources/icons/256x256.png', 'electron/img/logo.256.png'],
    [`${imageSource}/logo/32x32.png`]: 'resources/icons/32x32.png',
    [`${imageSource}/logo/logo.ico`]: 'electron/img/logo.ico',
    [`${contentSource}/translation/**`]: 'electron/locale/',
    ['wire-desktop/.env.defaults']: '.env.defaults',
  },
  repositoryUrl,
}

module.exports = options;

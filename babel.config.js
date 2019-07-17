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

const {
  devDependencies: {electron: electronVersion},
} = require('./package.json');
const plugins = ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-object-rest-spread'];

const buildPresets = ({modules = false, debug = false}) => [
  '@babel/preset-react',
  '@babel/preset-typescript',
  [
    '@babel/preset-env',
    {
      corejs: 'core-js@2',
      debug,
      modules,
      targets: {
        browsers: [`electron >= ${electronVersion}`],
      },
      useBuiltIns: 'usage',
    },
  ],
];

module.exports = {
  env: {
    test: {
      plugins,
      presets: buildPresets({modules: 'commonjs'}),
    },
  },
  plugins,
  presets: buildPresets({modules: false}),
};

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

// @ts-check
/* eslint-disable valid-jsdoc */

const plugins = ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-optional-chaining'];

/**
 * @param {{debug?: boolean, modules?: false | string}} options
 * @typedef {import('@babel/core').PluginItem} PluginItem
 * @returns {PluginItem[]}
 */
const buildPresets = ({debug = false, modules = false}) => {
  /** @type {PluginItem} */
  const browserEnvPreset = [
    '@babel/preset-env',
    {
      corejs: '3',
      debug,
      modules,
      targets: {
        browsers: ['chrome >= 78'],
      },
      useBuiltIns: 'usage',
    },
  ];

  return ['@babel/preset-react', '@babel/preset-typescript', browserEnvPreset];
};

/** @type {import('@babel/core').TransformOptions} */
const config = {
  env: {
    test: {
      plugins,
      presets: buildPresets({modules: 'commonjs'}),
    },
  },
  plugins,
  presets: buildPresets({modules: false}),
};

module.exports = config;

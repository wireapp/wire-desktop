/*
 * Wire
 * Copyright (C) 2023 Wire Swiss GmbH
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

const webpack = require('webpack');
const fs = require('fs');

const path = require('path');

/**
 * @type {(env: {production?: true}) => import('webpack').Configuration}
 * */

module.exports = (env = {}) => {
  // Read version from wire.json at build time
  let desktopVersion = 'unknown';
  try {
    const wireJsonPath = path.resolve(__dirname, 'electron/wire.json');
    const wireJson = JSON.parse(fs.readFileSync(wireJsonPath, 'utf8'));
    desktopVersion = wireJson.version || 'unknown';
  } catch (error) {
    console.warn('Could not read version from wire.json:', error.message);
  }

  return {
    devtool: env.production ? undefined : 'eval-cheap-source-map',
    entry: path.resolve(__dirname, 'electron/renderer/src/index.tsx'),
    externals: {
      'fs-extra': '{}',
    },
    mode: !env.production ? 'development' : 'production',
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.[tj]sx?$/,
          use: ['babel-loader'],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'electron/renderer/dist'),
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: env.production ? '"production"' : '"development"',
          DESKTOP_VERSION: `"${desktopVersion}"`,
        },
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    stats: 'errors-only',
    target: 'electron-renderer',
  };
};

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

const path = require('path');
const webpack = require('webpack');

const tsxEntry = path.resolve(__dirname, 'electron/renderer/src/index.tsx');
const htmlEntry = path.resolve(__dirname, 'electron/renderer');
const production = process.env.NODE_ENV === 'production';

module.exports = {
  devServer: production
    ? undefined
    : {
        contentBase: htmlEntry,
        hotOnly: true,
        port: 8080,
        writeToDisk: true,
      },
  devtool: production ? undefined : 'source-map',
  entry: tsxEntry,
  externals: {
    'fs-extra': '{}',
  },
  mode: !production ? 'development' : 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.[jt]sx?$/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  node: {
    fs: 'empty',
    path: 'empty',
  },
  output: {
    filename: 'dist/bundle.js',
    hotUpdateChunkFilename: 'cache/[id].[hash].hot-update.js',
    hotUpdateMainFilename: 'cache/[hash].hot-update.json',
    path: path.resolve(__dirname, 'electron/renderer'),
    publicPath: 'http://localhost:8080/',
  },
  plugins: production
    ? [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"production"',
          },
        }),
      ]
    : [new webpack.HotModuleReplacementPlugin(), new webpack.NamedModulesPlugin()],
  resolve: {
    alias: production
      ? undefined
      : {
          'react-dom': '@hot-loader/react-dom',
        },
    extensions: ['.js', '.ts', '.tsx'],
  },
  stats: 'errors-only',
};

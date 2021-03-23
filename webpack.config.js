// @ts-check
/* eslint-disable valid-jsdoc */

const path = require('path');
const webpack = require('webpack');

/** @type {(env: {production?: true}) => import('webpack').Configuration} */
module.exports = (env = {}) => ({
  devtool: env.production ? undefined : 'eval-cheap-source-map',
  entry: path.resolve(__dirname, 'electron/renderer/src/index.jsx'),
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
  plugins: env.production
    ? [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"production"',
          },
        }),
      ]
    : undefined,
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  stats: 'errors-only',
  target: 'electron-renderer',
});

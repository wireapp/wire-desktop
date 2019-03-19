const path = require('path');
const webpack = require('webpack');

module.exports = (env = {}) => ({
  devtool: env.production ? undefined : 'cheap-eval-source-map',
  entry: path.resolve(__dirname, 'electron/renderer/src/index.jsx'),
  externals: {
    'fs-extra': '{}',
  },
  mode: !env.production ? 'development' : 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.jsx?$/,
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
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'electron/renderer/dist'),
  },
  plugins: env.production
    ? [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('production'),
          },
        }),
      ]
    : undefined,
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [
      path.join(__dirname, 'electron', 'node_modules'),
      'node_modules',
      '/Users/sabri/Desktop/Repositories/wire-desktop-packages/node_modules',
    ],
  },
  stats: 'errors-only',
});

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
            NODE_ENV: '"production"',
          },
        }),
      ]
    : undefined,
  resolve: {
    alias: {
      // Note: Prevent modules that are linked locally from using their own React versions
      // https://github.com/facebook/react/issues/14257#issuecomment-508808246
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
  stats: 'errors-only',
});

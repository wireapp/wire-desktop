const path = require('path');
const webpack = require('webpack');

module.exports = (env = {}) => ({
  devtool: env.production ? '' : 'cheap-eval-source-map',
  entry: path.resolve(__dirname, 'electron/renderer/src/index.js'),
  mode: env.production ? 'production' : 'development',
  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        test: /\.js$/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ],
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
          NODE_ENV: JSON.stringify('production'),
        },
      }),
    ]
    : [],
});

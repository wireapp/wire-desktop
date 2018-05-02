const path = require('path');
const webpack = require('webpack');

module.exports = (env = {}) => {
  return {
    devtool: (() => {
      if (!env.production) {
        return 'cheap-eval-source-map';
      }
    })(),
    entry: path.resolve(__dirname, 'electron/renderer/src/index.js'),
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
    plugins: (() => {
      if (env.production) {
        return [
          new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify('production'),
            },
          }),
        ];
      }
    })(),
  };
};

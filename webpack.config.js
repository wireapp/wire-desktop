const path = require('path');
const webpack = require('webpack');

module.exports = (env = {}) => {
  return {
    entry: path.resolve(__dirname, 'electron/renderer/src/index.js'),
    output: {
      path: path.resolve(__dirname, 'electron/renderer/dist'),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: ['babel-loader']
        },
        {
          test: /\.css$/,
          use: [ 'style-loader', 'css-loader' ]
        }
      ]
    },
    devtool: (() => {
      if (!env.production) {
        return 'cheap-eval-source-map'
      }
    })(),
    plugins: (() => {
      if (env.production) {
        return [
          new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify('production')
            }
          })
        ];
      }
    })()
  };
}
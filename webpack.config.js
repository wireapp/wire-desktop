const path = require('path');
const BabiliPlugin = require('babili-webpack-plugin');

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
    devtool: (() => env.production ? undefined : 'cheap-eval-source-map')(),
    plugins: (() => env.production ? [new BabiliPlugin()] : [])()
  };
}

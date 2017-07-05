const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'electron/renderer/src/index.js'),
  output: {
    path: path.resolve(__dirname, 'electron/renderer/dist'),
    filename: 'bundle.js'
  },
  devtool: 'cheap-eval-source-map',
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
  }
};

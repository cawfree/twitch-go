const path = require('path');
const CopyPlugin  = require('copy-webpack-plugin');

module.exports = {
  entry: './extension/src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.mp3/i,
        use: 'file-loader',
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' }
      },
      {
        test: /\.wasm$/,
        loaders: ['wasm-loader']
      }
    ],
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new CopyPlugin([
      { from: './node_modules/@ffmpeg/core/ffmpeg-core.js', to: './ffmpeg-core.js' },
      { from: './extension/index.js', to: './index.js' },
      { from: './extension/icon.png', to: './icon.png' },
      { from: './extension/index.html', to: './index.html' },
      { from: './extension/manifest.json', to: './manifest.json' },
    ]),
  ],
  // XXX: hack to make fs work
  target: 'node',
};

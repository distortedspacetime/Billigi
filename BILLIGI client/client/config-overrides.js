const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    path: path.resolve(__dirname, 'node_modules/path-browserify'),
    os: path.resolve(__dirname, 'node_modules/os-browserify/browser')
  })
);
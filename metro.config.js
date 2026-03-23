const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for SQLite asset bundling
config.resolver.assetExts.push('db');

module.exports = config;

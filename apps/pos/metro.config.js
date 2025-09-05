// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get list of built-in Node.js modules
const nodeCoreModules = require('node:module').builtinModules;

// Find the project and workspace root directories
const projectRoot = __dirname;
// Root of the monorepo
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Configure SVG transformer
// Source: https://github.com/kristerkari/react-native-svg-transformer#step-3-configure-metro
config.transformer = {
  ...config.transformer, // Keep existing transformer config
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...config.resolver, // Keep existing resolver config
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'), // Remove svg from assetExts
  sourceExts: [...config.resolver.sourceExts, 'svg'], // Add svg to sourceExts
  // 4. Ignore the shared node_modules to prevent duplicate module instances.
  blockList: [/\/packages\/ui\/node_modules\/.*/],

  extraNodeModules: nodeCoreModules.reduce((acc, moduleName) => {
    // Map core modules to their browser/react-native equivalents
    if (moduleName === 'buffer') {
      acc['buffer'] = path.resolve(projectRoot, 'node_modules/buffer');
    } else if (moduleName === 'stream') {
      acc['stream'] = path.resolve(projectRoot, 'node_modules/stream-browserify');
    } else if (moduleName === 'vm') {
      acc['vm'] = path.resolve(projectRoot, 'node_modules/vm-browserify');
    } else if (moduleName === 'crypto') {
      // Map 'crypto' to react-native-crypto
      acc['crypto'] = path.resolve(projectRoot, 'node_modules/react-native-crypto');
    } else if (moduleName === 'process') {
      acc['process'] = path.resolve(projectRoot, 'node_modules/process');
    }
    // Add mappings for other Node modules if needed (e.g., path, http)
    return acc;
  }, {}),
};

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve dependencies in workspace root
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get list of built-in Node.js modules
const nodeCoreModules = require('node:module').builtinModules;
const fs = require('fs');
const { resolve } = require('metro-resolver');

// Find the project and workspace root directories
const projectRoot = __dirname;
// Root of the monorepo
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot, {
  // Enable package.json exports by default for SDK 53
  unstable_enablePackageExports: true
});

// Configure SVG transformer
// Source: https://github.com/kristerkari/react-native-svg-transformer#step-3-configure-metro
config.transformer = {
  ...config.transformer, // Keep existing transformer config
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
function resolveModulePath(pkg) {
  const local = path.resolve(projectRoot, 'node_modules', pkg);
  const root = path.resolve(workspaceRoot, 'node_modules', pkg);
  if (fs.existsSync(local)) return local;
  return root;
}

const aliasPaths = {
  '@react-navigation/native': resolveModulePath('@react-navigation/native'),
  '@react-navigation/native-stack': resolveModulePath('@react-navigation/native-stack'),
  '@react-navigation/bottom-tabs': resolveModulePath('@react-navigation/bottom-tabs'),
  '@react-navigation/elements': resolveModulePath('@react-navigation/elements'),
  'expo-router': resolveModulePath('expo-router'),
  react: resolveModulePath('react'),
  'react-dom': resolveModulePath('react-dom'),
};

function customResolveRequest(context, moduleName, platform) {
  if (aliasPaths[moduleName]) {
    return resolve(context, aliasPaths[moduleName], platform);
  }
  return resolve(context, moduleName, platform);
}

config.resolver = {
  ...config.resolver, // Keep existing resolver config
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'), // Remove svg from assetExts
  sourceExts: [...config.resolver.sourceExts, 'svg'], // Add svg to sourceExts
  // 4. Ignore the shared node_modules to prevent duplicate module instances.
  blockList: [
    /\/packages\/ui\/node_modules\/.*/,
    /@react-navigation\/bottom-tabs\/node_modules\/.*@react-navigation\/native/,
    /@react-navigation\/native-stack\/node_modules\/.*@react-navigation\/native/,
  ],
  resolveRequest: customResolveRequest,
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
    return acc;
  }, aliasPaths),
};

// 1. Watch all files within the monorepo
// Preserve default watchFolders and add workspace root
config.watchFolders = [
  ...config.watchFolders,
  workspaceRoot
].filter((folder, index, arr) => arr.indexOf(folder) === index); // Remove duplicates

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Use Expo's default hierarchical lookup setting
// config.resolver.disableHierarchicalLookup = false; // Use default for SDK 53

module.exports = config;
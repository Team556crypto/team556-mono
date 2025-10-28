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
  
  // Handle Node.js core module polyfills
  const nodeModulePolyfills = {
    'buffer': 'buffer',
    'stream': 'stream-browserify',
    'vm': 'vm-browserify',
    'crypto': 'react-native-crypto',
    'process': 'process',
  };
  
  if (nodeModulePolyfills[moduleName]) {
    return resolve(context, nodeModulePolyfills[moduleName], platform);
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
    // Check both local and workspace root node_modules
    if (moduleName === 'buffer') {
      const bufferPath = resolveModulePath('buffer');
      acc['buffer'] = bufferPath;
    } else if (moduleName === 'stream') {
      const streamPath = resolveModulePath('stream-browserify');
      acc['stream'] = streamPath;
    } else if (moduleName === 'vm') {
      const vmPath = resolveModulePath('vm-browserify');
      acc['vm'] = vmPath;
    } else if (moduleName === 'crypto') {
      // Map 'crypto' to react-native-crypto
      const cryptoPath = resolveModulePath('react-native-crypto');
      acc['crypto'] = cryptoPath;
    } else if (moduleName === 'process') {
      const processPath = resolveModulePath('process');
      acc['process'] = processPath;
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

// 3. Force Metro to resolve dependencies in workspace root
// config.resolver.disableHierarchicalLookup = true; // Removed per SDK 53 compatibility

module.exports = config;
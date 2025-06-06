// /Users/brandonprice/Documents/Dev/team556-mono/apps/wp-plugin/webpack.config.js
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const webpack = require('webpack'); // Required for ProvidePlugin
const path = require('path'); // For resolving node_modules path

module.exports = {
    ...defaultConfig,
    mode: 'development',
    externals: {
        // Default externals from @wordpress/scripts
        ...defaultConfig.externals,

        // WooCommerce Packages
        '@woocommerce/blocks-registry': ['wc', 'wcBlocksRegistry'],
        '@woocommerce/settings': ['wc', 'wcSettings'],

        // WordPress Packages (already typically handled, but good to be explicit if issues arise)
        '@wordpress/components': 'wp.components',
        '@wordpress/element': 'wp.element',
        '@wordpress/html-entities': 'wp.htmlEntities',
        '@wordpress/i18n': 'wp.i18n',
        '@wordpress/api-fetch': 'wp.apiFetch',
    },
    resolve: {
        // Ensure we spread defaultConfig.resolve if it exists, otherwise start fresh
        ...(defaultConfig.resolve || {}),
        fallback: {
            // Spread existing fallbacks from defaultConfig.resolve.fallback if they exist
            ...(defaultConfig.resolve && defaultConfig.resolve.fallback ? defaultConfig.resolve.fallback : {}),
            "buffer": require.resolve("buffer"),
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util"),
            "process": require.resolve("process/browser"),
        }
    },
    module: {
        ...(defaultConfig.module || { rules: [] }), // Ensure defaultConfig.module and rules exist
        rules: [
            // Spread existing rules, ensuring defaultConfig.module.rules is an array
            ...(defaultConfig.module && Array.isArray(defaultConfig.module.rules) ? defaultConfig.module.rules : []),
            {
                test: /\.(js|jsx)$/,
                include: [
                    // Adjust path for monorepo structure if node_modules is at the root
                    path.resolve(__dirname, '../../node_modules/qrcode.react'),
                    path.resolve(__dirname, 'node_modules/qrcode.react')
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [require.resolve('@wordpress/babel-preset-default')],
                        // Add any necessary Babel plugins here if defaults aren't enough
                    }
                }
            }
        ]
    },
    plugins: [
        // Spread existing plugins from defaultConfig.plugins if they exist
        ...(defaultConfig.plugins || []),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'], // Provide Buffer globally
            process: 'process/browser', // Provide process polyfill
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify({}),
            'global': 'globalThis',
        }),
    ],
};

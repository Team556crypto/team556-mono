// /Users/brandonprice/Documents/Dev/team556-mono/apps/wp-plugin/webpack.config.js
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const webpack = require('webpack'); // Required for ProvidePlugin

module.exports = {
    ...defaultConfig,
    externals: {
        // Default externals from @wordpress/scripts
        ...defaultConfig.externals,

        // WooCommerce Packages
        '@woocommerce/blocks-registry': 'wc.blocksRegistry',
        '@woocommerce/settings': 'wc.settings',
        // You might also need other @woocommerce packages depending on future imports
        // e.g., '@woocommerce/price-format': 'wc.priceFormat',

        // WordPress Packages (already typically handled, but good to be explicit if issues arise)
        '@wordpress/components': 'wp.components',
        '@wordpress/element': 'wp.element',
        '@wordpress/html-entities': 'wp.htmlEntities',
        '@wordpress/i18n': 'wp.i18n',
        // Add any other @wordpress/* packages you import here
    },
    resolve: {
        // Ensure we spread defaultConfig.resolve if it exists, otherwise start fresh
        ...(defaultConfig.resolve || {}),
        fallback: {
            // Spread existing fallbacks from defaultConfig.resolve.fallback if they exist
            ...(defaultConfig.resolve && defaultConfig.resolve.fallback ? defaultConfig.resolve.fallback : {}),
            "buffer": require.resolve("buffer/"), // Polyfill for buffer
        }
    },
    plugins: [
        // Spread existing plugins from defaultConfig.plugins if they exist
        ...(defaultConfig.plugins || []),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'], // Provide Buffer globally
        }),
    ],
};

// Utility to load the root .env file for Node.js/React Native (Expo) apps
const path = require('path');
const dotenv = require('dotenv');

// Adjust the path to the root .env file
const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

module.exports = () => {};

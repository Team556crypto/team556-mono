// Utility to load the root .env file for Node.js apps
const path = require('path');
const dotenv = require('dotenv');

// Adjust the path to the root .env file
const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

module.exports = () => {};

const fs = require('fs');
const path = require('path');

// Path to the root .env file (relative to the script's location)
const rootEnvPath = path.resolve(__dirname, '../.env');
// Path to the target app's .env file (assumes script is run from app's root)
const targetEnvPath = path.resolve(process.cwd(), '.env');

const { log, warn, error } = console

log(`Syncing root .env (${rootEnvPath}) to ${targetEnvPath}...`);

try {
  // Check if root .env exists
  if (!fs.existsSync(rootEnvPath)) {
    warn(`Root .env file not found at ${rootEnvPath}. Creating empty target .env.`);
    // Create an empty target .env if root doesn't exist to avoid errors
    fs.writeFileSync(targetEnvPath, '', 'utf8');
    process.exit(0); // Exit successfully
  }

  // Read the root .env content
  const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');

  // Write the content to the target app's .env file
  fs.writeFileSync(targetEnvPath, rootEnvContent, 'utf8');

  log('.env sync complete.');
} catch (err) {
  error('Error syncing .env file:', err);
  process.exit(1); // Exit with error
}
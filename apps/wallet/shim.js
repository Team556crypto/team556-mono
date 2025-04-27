// Essential polyfills for React Native

// process
if (typeof process === 'undefined') {
  global.process = require('process');
} else {
  const bProcess = require('process');
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}
process.browser = false; // Indicate we're not in a standard browser env
process.env = process.env || {}; // Ensure process.env exists
process.env['NODE_ENV'] = __DEV__ ? 'development' : 'production';

// Buffer
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Global __dirname and __filename (optional, but can help some libs)
// if (typeof __dirname === 'undefined') global.__dirname = '/';
// if (typeof __filename === 'undefined') global.__filename = '';

// Comment out other potentially problematic polyfills for now
/*
 if (typeof __dirname === 'undefined') global.__dirname = '/'
 if (typeof __filename === 'undefined') global.__filename = ''
 if (typeof process === 'undefined') {
{{ ... }}
 // crypto is loaded first, so it can populate global.crypto
 // require('crypto')
*/

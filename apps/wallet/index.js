// index.js - Custom entry point for Expo SDK 49+ with Expo Router

// Polyfill for crypto.getRandomValues using expo-crypto
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';

class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}

// Set up global crypto object if it doesn't exist
const webCrypto = typeof crypto !== 'undefined' ? crypto : new Crypto();
(() => {
  if (typeof crypto === 'undefined') {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
})();

// Polyfill for Buffer
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Import the main Expo Router entry point *after* polyfills
import 'expo-router/entry';

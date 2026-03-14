// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Remove the Cross-Origin-Opener-Policy header from the server responses during local development.
// This allows the expo-auth-session Google pop-up window to correctly communicate with the parent window and close itself.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const originalSetHeader = res.setHeader;
      res.setHeader = function (name, value) {
        if (
          name.toLowerCase() === 'cross-origin-opener-policy' ||
          name.toLowerCase() === 'cross-origin-embedder-policy'
        ) {
          // Do not send these headers to prevent blocking window.close()
          return;
        }
        return originalSetHeader.apply(this, arguments);
      };
      
      const originalWriteHead = res.writeHead;
      res.writeHead = function (statusCode, statusMessage, headers) {
        let headersObj = headers;
        if (typeof statusMessage === 'object') {
          headersObj = statusMessage;
        }
        if (headersObj) {
          Object.keys(headersObj).forEach((key) => {
            if (
              key.toLowerCase() === 'cross-origin-opener-policy' ||
              key.toLowerCase() === 'cross-origin-embedder-policy'
            ) {
              delete headersObj[key];
            }
          });
        }
        return originalWriteHead.apply(this, arguments);
      };

      return middleware(req, res, next);
    };
  },
};

module.exports = config;

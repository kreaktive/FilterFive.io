/**
 * Babel Configuration
 * Used by Jest to transform ESM modules to CommonJS
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }]
  ],
};

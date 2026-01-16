/** @type {import('tailwindcss').Config} */
const tokens = require('./src/config/designTokens');

module.exports = {
  content: [
    './src/views/**/*.ejs',
    './src/utils/portableText.js',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.brand,
        status: tokens.colors.status,
        neutral: tokens.colors.neutral,
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily.sans],
        display: [tokens.typography.fontFamily.display],
        // Alias for backwards compatibility
        title: [tokens.typography.fontFamily.display],
      },
      fontSize: tokens.typography.fontSize,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      screens: {
        'mobile': tokens.breakpoints.mobile,
        'tablet': tokens.breakpoints.tablet,
        'desktop': tokens.breakpoints.desktop,
        'wide': tokens.breakpoints.wide,
      },
      zIndex: tokens.zIndex,
    }
  },
  plugins: [],
}

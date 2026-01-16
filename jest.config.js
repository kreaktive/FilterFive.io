/**
 * Jest Configuration
 *
 * Separate configurations for unit tests and integration tests.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Setup file that runs before all tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/public/',
    '/coverage/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/scripts/**',
    '!src/data/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Module paths for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Transform ESM modules to CommonJS
  transformIgnorePatterns: [
    '/node_modules/(?!(@faker-js/faker)/)',
  ],

  // Use babel-jest to transform ESM modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Verbose output
  verbose: true,

  // Timeout for async operations (30 seconds for integration tests)
  testTimeout: 30000,

  // Run tests in band (sequentially) for integration tests
  // Set to false for faster parallel unit tests
  // runInBand: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Force exit after tests complete (useful for hanging connections)
  forceExit: true,

  // Detect open handles (async operations not cleaned up)
  detectOpenHandles: true,

  // Global setup and teardown (for database, etc.)
  // globalSetup: '<rootDir>/tests/globalSetup.js',
  // globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/tests/**/*.test.js',
        '!<rootDir>/tests/integration/**',
        '!<rootDir>/tests/e2e/**',
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      transform: {
        '^.+\\.js$': 'babel-jest',
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(@faker-js/faker)/)',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      transform: {
        '^.+\\.js$': 'babel-jest',
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(@faker-js/faker)/)',
      ],
    },
  ],
};

// Jest configuration for TypeScript Node.js testing
module.exports = {
    // Use ts-jest preset for TypeScript support
  // This allows Jest to understand TypeScript files
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

    // Set the test environment to Node.js (for backend testing)
    // This simulates a Node.js environment in tests
    testEnvironment: 'node',

    // Define where Jest should look for test files
    // Tests are expected to be in the 'tests' directory
    roots: ['<rootDir>/tests'],

    // Pattern to match test files
    // Looks for files ending with .test.ts in any subdirectory
    testMatch: ['**/*.test.ts'],

    // Define which files should be included in coverage reports
    collectCoverageFrom: [
        // Include all TypeScript/TSX files in src directory
        'src/**/*.{ts,tsx}',
        // Exclude the main index file from coverage
        '!src/index.ts',
        // Exclude type definition files
        '!src/types/**/*'
    ],

    // Directory where coverage reports will be saved
    coverageDirectory: 'coverage',

    // Generate multiple coverage report formats
    // - text: Shows coverage summary in console
    // - lcov: Generates lcov report (used by code coverage services)
    // - html: Generates HTML report in coverage/ directory
    coverageReporters: ['text', 'lcov', 'html']
};
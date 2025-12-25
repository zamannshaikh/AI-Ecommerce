/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // 1. Use the ESM preset for ts-jest
  preset: 'ts-jest/presets/default-esm', 
  
  testEnvironment: 'node',
  
  // 2. Tell Jest to treat .ts files as ESM
  extensionsToTreatAsEsm: ['.ts'],
  
  // 3. Handle the ".js" imports in your TypeScript code
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // 4. Transform settings for ESM support
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};
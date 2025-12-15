import type { Config } from 'jest';

const config: Config = {
  // 1. Use ts-jest with ESM support
  preset: 'ts-jest/presets/default-esm', 
  testEnvironment: 'node',
  
  // 2. Tell Jest to handle .ts files as ESM
  extensionsToTreatAsEsm: ['.ts'],
  
  // 3. Transform config to forcefully enable ESM
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  
  // 4. Force module resolution to look for .js extension imports
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config;
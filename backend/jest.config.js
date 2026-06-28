module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/testUtils/jest.setup.js'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js', '!src/docs/openapi.js', '!src/scripts/**'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};

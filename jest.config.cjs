module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['js/**/*.js'],
  moduleFileExtensions: ['js', 'json'],
};


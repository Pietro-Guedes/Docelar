module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  globalSetup: '<rootDir>/tests/globalSetup.cjs',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // os arquivos de src são .js com JSX dentro; o babel (preset-react) cuida disso
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: { '\\.(css|svg)$': '<rootDir>/tests/styleMock.cjs' },
  clearMocks: true,
};

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  setupFiles: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/__mocks__/fileMock.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^date-fns/(.*)$': '<rootDir>/node_modules/date-fns/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(date-fns|@mui/x-date-pickers)/)',
  ],
  moduleDirectories: ['node_modules', 'src'],
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/setupTests.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};

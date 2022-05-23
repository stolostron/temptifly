const jestConfig = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!**/src/index.js', '!**/src/TemplateEditor/**'],
  coverageDirectory: './test-output/coverage',
  coverageReporters: ['json-summary', 'json', 'html', 'lcov', 'text', 'text-summary'],
  testResultsProcessor: 'jest-sonar-reporter',
  testURL: 'http://localhost/',
  coverageThreshold: {
    // TODO - increase threshold once repo is finalized
    global: {
      branches: 20,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  testMatch: [
    '<rootDir>/tests/jest/**/*.test.js?(x)',
    '<rootDir>/tests/jest/**/**/*.test.js?(x)',
    '<rootDir>/tests/jest/**/**/**/*.test.js?(x)',
    '**/tests/jest/**/*.test.js',
    '**/src-web/**/*.test.js',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '.+\\.(hbs)$': 'jest-handlebars',
    '.+\\.(handlebars)$': 'jest-handlebars',
    '.+\\.(yaml)$': 'jest-yaml-transform',
  },
  transformIgnorePatterns: ['/node_modules/(?!monaco-editor).+\\.js$'],
  setupFiles: ['<rootDir>/tests/jest/config/setup.js'],
  moduleNameMapper: {
    '\\.(css|svg)$': '<rootDir>/tests/jest/config/styleMock.js',
    'monaco-editor': '<rootDir>/node_modules/react-monaco-editor',
  },
}

jestConfig.reporters = process.env.TRAVIS ? ['default'] : ['default']

module.exports = jestConfig

const jestConfig = {
  'collectCoverageFrom': [
    'src/components/**/*.js',
    '!src/components/**/*-story.js'
  ],
  'coverageDirectory': 'coverage',
  'coverageReporters': [
    'json-summary',
    'json',
    'html',
    'lcov',
    'text'
  ],
  'setupFiles': [
    '<rootDir>/config/jest/setup.js'
  ],
  'testMatch': [
    '<rootDir>/**/__tests__/**/*.js?(x)',
    '<rootDir>/**/?(*-)(spec|test).js?(x)'
  ],
  'testURL': 'http://localhost',
  'transform': {
    '^.+\\.(js|jsx)$': '<rootDir>/config/jest/jsTransform.js',
    '^.+\\.s?css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js'
  },
  'testPathIgnorePatterns': [
    '/node_modules/',
    '/examples/',
    '/config/',
    '/lib/',
    '/es/',
    '/cjs/'
  ],
  'transformIgnorePatterns': [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'
  ],
  'moduleFileExtensions': [
    'js',
    'json'
  ],
  'snapshotSerializers': [
    'enzyme-to-json/serializer'
  ]
}

jestConfig.reporters = [ 'default' ]

module.exports = jestConfig

setupFilesAfterEnv: ['./tests/setup.js']


module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/db.js'
  ]
};

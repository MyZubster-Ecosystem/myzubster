module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!(chai|@octokit/rest|@octokit/core|@octokit/plugin-request-log|@octokit/plugin-paginate-rest|@octokit/plugin-rest-endpoint-methods)/)'
  ],
  moduleNameMapper: {
    '^bcrypt$': '<rootDir>/__mocks__/bcrypt.js'
  }
};

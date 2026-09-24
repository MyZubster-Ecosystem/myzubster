module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!(chai|@octokit/rest|@octokit/core|@octokit/plugin-request-log|@octokit/plugin-paginate-rest|@octokit/plugin-rest-endpoint-methods)/)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/tests/kefirHandDelivery.node.test.js
};,
    '/src/services/marketplaceOrderPaymentPolicy.test.js
};
  ]
};
// Mock for file imports in tests
module.exports = 'test-file-stub';

// Mock for CSS modules
module.exports = new Proxy(
  {},
  {
    get: function (target, key) {
      if (key === '__esModule') {
        return false;
      }
      return key;
    },
  }
);

// BrowserStack configuration for cross-browser testing
const browserStackUser = process.env.BROWSERSTACK_USERNAME || '';
const browserStackKey = process.env.BROWSERSTACK_ACCESS_KEY || '';

module.exports = {
  // Browsers to test on
  browsers: {
    chrome: {
      base: 'BrowserStack',
      browser: 'Chrome',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '10'
    },
    firefox: {
      base: 'BrowserStack',
      browser: 'Firefox',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '10'
    },
    safari: {
      base: 'BrowserStack',
      browser: 'Safari',
      browser_version: '14.1',
      os: 'OS X',
      os_version: 'Big Sur'
    },
    edge: {
      base: 'BrowserStack',
      browser: 'Edge',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '10'
    },
    ie11: {
      base: 'BrowserStack',
      browser: 'IE',
      browser_version: '11.0',
      os: 'Windows',
      os_version: '10'
    },
    ios: {
      base: 'BrowserStack',
      device: 'iPhone 13',
      os: 'ios',
      os_version: '15',
      real_mobile: true
    },
    android: {
      base: 'BrowserStack',
      device: 'Samsung Galaxy S21',
      os: 'android',
      os_version: '11.0',
      real_mobile: true
    }
  },

  // Test configuration
  test_settings: {
    default: {
      screenshots: {
        enabled: true,
        path: 'browserstack-screenshots',
        on_failure: true,
        on_error: true
      },
      desiredCapabilities: {
        'browserstack.user': browserStackUser,
        'browserstack.key': browserStackKey,
        'browserstack.debug': true,
        'browserstack.console': 'verbose',
        'browserstack.networkLogs': true,
        'browserstack.local': false,
        'browserstack.timezone': 'UTC',
        'browserstack.video': true,
        'browserstack.idleTimeout': 300,
        'resolution': '1920x1080'
      }
    }
  },

  // Test runner configuration
  test_runner: {
    type: 'mocha',
    options: {
      ui: 'bdd',
      reporter: 'spec',
      timeout: 60000
    }
  },

  // Output settings
  output_folder: 'reports',
  output_trace: true,
  output_screenshots: true,
  output_video: true
};

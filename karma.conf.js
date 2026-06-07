// The @angular/build:karma builder supplies the jasmine framework, the Angular
// karma plugin and the coverage/reporter plugins itself. Here we only set
// CHROME_BIN and register the no-sandbox headless launcher used in CI/containers.
process.env['CHROME_BIN'] =
  process.env['CHROME_BIN'] ||
  '/root/.cache/puppeteer/chrome/linux-146.0.7680.76/chrome-linux64/chrome';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [require('karma-jasmine'), require('karma-chrome-launcher')],
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    restartOnFileChange: false,
    singleRun: true,
  });
};

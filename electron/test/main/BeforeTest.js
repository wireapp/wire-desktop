const glob = require('glob');
const path = require('path');

/**
 * Workaround to include all source code files in the report:
 * https://github.com/jprichardson/electron-mocha/issues/135
 *
 * Code needs to be imported from the instrumented sources:
 * https://github.com/jprichardson/electron-mocha/issues/19#issuecomment-193374439
 */
const loadSourceCode = () => {
  const intrumentedCode = path.join(__dirname, '../../instrumented-code');

  /**
   * We exclude code which needs to be run in renderer process because we currently run tests only in Electron's main process:
   * https://github.com/jprichardson/electron-mocha#code-coverage
   *
   * If we would like to get reports of renderer code too, we would need to setup a separate test run using "electron-mocha --renderer" and then combine both "coverage.json" files before generating the report.
   */
  glob(`${intrumentedCode}/!(renderer)**/*.js`, {
    sync: true,
  }).forEach(file => require(path.resolve(file)));
};

before(() => loadSourceCode());

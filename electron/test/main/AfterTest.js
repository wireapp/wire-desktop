const path = require('path');
const fs = require('fs-extra');

/**
 * Bind to mocha's "after" hook in order to write coverage info:
 * https://github.com/jprichardson/electron-mocha/issues/19#issuecomment-193451731
 */
const writeCoverageReport = coverage => {
  const outputFile = path.resolve(process.cwd(), 'instrumented-code/coverage.json');
  fs.writeJsonSync(outputFile, coverage);
};

after(() => {
  const info = global.__coverage__;
  if (info) {
    writeCoverageReport(info);
  }
});

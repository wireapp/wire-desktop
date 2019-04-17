import * as fs from 'fs-extra';
import * as path from 'path';

declare global {
  namespace NodeJS {
    interface Global {
      __coverage__: {};
    }
  }
}

const writeCoverageReport = (coverage: Object) => {
  const outputFile = path.join(process.cwd(), `.nyc_output/coverage.${process['type']}.json`);
  fs.outputJsonSync(outputFile, coverage);
};

after(() => {
  const coverageInfo = global.__coverage__;
  if (coverageInfo) {
    writeCoverageReport(coverageInfo);
  }
});

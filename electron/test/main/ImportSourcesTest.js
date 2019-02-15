/**
 * Workaround to include all source code files in the report:
 * https://github.com/jprichardson/electron-mocha/issues/135
 *
 * Code needs to be imported from the instrumented sources:
 * https://github.com/jprichardson/electron-mocha/issues/19#issuecomment-193374439
 */
const {AutomatedSingleSignOn} = require('../../instrumented-code/lib/AutomatedSingleSignOn');

module.exports = {
  AutomatedSingleSignOn,
};

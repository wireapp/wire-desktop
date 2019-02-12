import {LogFactory, LoggerOptions} from '@wireapp/commons';
import * as logdown from 'logdown';

const LOGGER_NAMESPACE = 'wire-desktop';
const {environment} = require('../../package.json');

function getLogger(name: string): logdown.Logger {
  const options: LoggerOptions = {
    namespace: LOGGER_NAMESPACE,
    separator: '/',
  };

  if (environment !== 'production') {
    options.forceEnable = true;
  }

  return LogFactory.getLogger(name, options);
}

export {getLogger, LOGGER_NAMESPACE};

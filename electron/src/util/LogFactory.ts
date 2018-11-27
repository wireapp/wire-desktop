const ansiRegex = require('ansi-regex');
import * as fs from 'fs-extra';
import * as logdown from 'logdown';
import * as moment from 'moment';
import * as path from 'path';

class LogFactory {
  static LOG_FILE_PATH: string;
  static LOG_FILE_NAME: string;
  static NAMESPACE: string = 'wire-desktop::';

  static COLOR_STEP = {
    B: 97,
    G: 79,
    R: 31,
  };

  static COLOR_CODE = {
    B: 0,
    G: 0,
    R: 0,
  };

  static getFileURI(): string {
    return path.join(LogFactory.LOG_FILE_PATH, LogFactory.LOG_FILE_NAME);
  }

  static getColor(): string {
    LogFactory.COLOR_CODE.R = (LogFactory.COLOR_CODE.R + LogFactory.COLOR_STEP.R) % 256;
    LogFactory.COLOR_CODE.G = (LogFactory.COLOR_CODE.G + LogFactory.COLOR_STEP.G) % 256;
    LogFactory.COLOR_CODE.B = (LogFactory.COLOR_CODE.B + LogFactory.COLOR_STEP.B) % 256;

    const rHex = Number(LogFactory.COLOR_CODE.R)
      .toString(16)
      .padStart(2, '0');
    const gHex = LogFactory.COLOR_CODE.G.toString(16).padStart(2, '0');
    const bHex = LogFactory.COLOR_CODE.B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  }

  static addTimestamp(logTransport: logdown.TransportOptions): void {
    if (~logTransport.msg.indexOf(LogFactory.NAMESPACE)) {
      logTransport.args.unshift(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]`);
    }
  }

  static async writeToFile(logTransport: logdown.TransportOptions): Promise<void> {
    if (LogFactory.LOG_FILE_PATH && LogFactory.LOG_FILE_NAME) {
      const [time] = logTransport.args;
      const logMessage = `${time} ${logTransport.msg}`;
      const withoutColor = logMessage.replace(ansiRegex(), '');
      try {
        await fs.outputFile(LogFactory.getFileURI(), `${withoutColor}\r\n`, {
          encoding: 'utf8',
          flag: 'a',
        });
      } catch (error) {
        console.warn(`Cannot write to log file "${LogFactory.getFileURI()}": ${error.message}`, error);
      }
    }
  }

  static getLogger(name: string, options?: {color?: string; forceEnable?: boolean}): logdown.Logger {
    const defaults = {
      color: LogFactory.getColor(),
      forceEnable: false,
    };
    const config = {...defaults, ...options};

    if (logdown.transports.length === 0) {
      logdown.transports.push(LogFactory.addTimestamp);
      logdown.transports.push(LogFactory.writeToFile);
    }
    const loggerName = `${LogFactory.NAMESPACE}${name}`;

    const logger = logdown(loggerName, {
      logger: console,
      markdown: false,
      prefixColor: config.color,
    });

    if (config.forceEnable) {
      logger.state.isEnabled = true;
    }

    return logger;
  }
}

export {LogFactory};

import * as logdown from 'logdown';
import * as moment from 'moment';

class LogFactory {
  static NAMESPACE = 'wire-desktop';

  static COLOR_STEPS = {
    B: 97,
    G: 79,
    R: 31,
  };

  static COLOR_CODE = {
    B: 0,
    G: 0,
    R: 0,
  };

  static getColor() {
    LogFactory.COLOR_CODE.R = (LogFactory.COLOR_CODE.R + LogFactory.COLOR_STEPS.R) % 256;
    LogFactory.COLOR_CODE.G = (LogFactory.COLOR_CODE.G + LogFactory.COLOR_STEPS.G) % 256;
    LogFactory.COLOR_CODE.B = (LogFactory.COLOR_CODE.B + LogFactory.COLOR_STEPS.B) % 256;

    const rHex = Number(LogFactory.COLOR_CODE.R)
      .toString(16)
      .padStart(2, '0');
    const gHex = LogFactory.COLOR_CODE.G.toString(16).padStart(2, '0');
    const bHex = LogFactory.COLOR_CODE.B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  }

  static addTimestamp(logTransport: logdown.TransportOptions) {
    if (~logTransport.msg.indexOf(LogFactory.NAMESPACE)) {
      logTransport.args.unshift(`[${moment().format('HH:mm:ss')}]`);
    }
  }

  static getLogger(name: string, color: string = LogFactory.getColor()) {
    if (logdown.transports.length === 0) {
      logdown.transports.push(LogFactory.addTimestamp);
    }
    const loggerName = `${LogFactory.NAMESPACE}::${name}`;

    return logdown(loggerName, {
      logger: console,
      markdown: false,
      prefixColor: color,
    });
  }
}

export {LogFactory};

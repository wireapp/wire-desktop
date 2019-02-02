/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import {LogFactory} from '@wireapp/commons';
import {app} from 'electron';
import * as path from 'path';
import {URL} from 'url';
import {platform} from '../js/environment';
import {AutomatedSingleSignOn} from './AutomatedSingleSignOn';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron.log');
const logger = LogFactory.getLogger('CoreProtocol', {forceEnable: true, logFilePath: LOG_FILE});

const {customProtocolName} = require('../../package.json');
const CORE_PROTOCOL = customProtocolName || 'wire';
const CORE_PROTOCOL_SSO = 'sso-code';
const CORE_PROTOCOL_POSITION = 1;

const dispatcher = async (url?: string) => {
  if (typeof url === 'undefined' || !url.startsWith(`${CORE_PROTOCOL}://`)) {
    return;
  }

  const route = new URL(url);

  logger.log('Electron "open-url" event fired');

  switch (route.host) {
    case CORE_PROTOCOL_SSO: {
      logger.log('Automatic SSO detected');
      await AutomatedSingleSignOn.handleProtocolRequest(route);
      break;
    }

    default: {
      logger.log(`Unknown route detected. Full URL: ${route.toString()}`);
      break;
    }
  }
};

export const registerCoreProtocol = () => {
  // Immediately register the protocol system-wide if needed
  if (!app.isDefaultProtocolClient(CORE_PROTOCOL)) {
    app.setAsDefaultProtocolClient(CORE_PROTOCOL);
  }

  if (platform.IS_MAC_OS) {
    app.on('open-url', async (event, url) => {
      event.preventDefault();
      await dispatcher(url);
    });
  } else if (platform.IS_WINDOWS) {
    app.once('ready', async () => {
      const url = process.argv[CORE_PROTOCOL_POSITION];
      await dispatcher(url);
    });
    app.on('second-instance', async (event, argv) => {
      const url = argv[CORE_PROTOCOL_POSITION];
      await dispatcher(url);
    });
  }
};

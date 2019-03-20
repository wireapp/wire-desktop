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
import {platform} from '../runtime/EnvironmentUtil';
import {WindowManager} from '../window/WindowManager';
import {AutomatedSingleSignOn} from './AutomatedSingleSignOn';
import {EVENT_TYPE} from './eventType';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron.log');
const logger = LogFactory.getLogger('CoreProtocol', {forceEnable: true, logFilePath: LOG_FILE});

const {customProtocolName} = require('../../package.json');
const CORE_PROTOCOL = customProtocolName || 'wire';
// @see https://github.com/wearezeta/documentation/tree/master/topics/client-API#available-endpoints
const CORE_PROTOCOL_SSO = 'start-sso';
// wire://conversation/afbb5d60-1187-4385-9c29-7361dea79647
const SHOW_CONVERSATION = 'conversation';
const CORE_PROTOCOL_POSITION = 1;
const CORE_PROTOCOL_MAX_LENGTH = 1024;

const dispatcher = async (url?: string) => {
  if (typeof url === 'undefined' || !url.startsWith(`${CORE_PROTOCOL}://`) || url.length > CORE_PROTOCOL_MAX_LENGTH) {
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
    case SHOW_CONVERSATION: {
      logger.log('Clicked on a custom protocol link to show a conversation...');
      const primaryWindow = WindowManager.getPrimaryWindow();
      const conversationId = 'afbb5d60-1187-4385-9c29-7361dea79647';
      if (primaryWindow) {
        primaryWindow.webContents.send(EVENT_TYPE.CONVERSATION.SHOW, conversationId);
      }
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
  } else {
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

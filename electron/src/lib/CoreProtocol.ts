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
import {EVENT_TYPE} from './eventType';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'electron.log');
const logger = LogFactory.getLogger('CoreProtocol', {forceEnable: true, logFilePath: LOG_FILE});

const {customProtocolName} = require('../../package.json');
const CORE_PROTOCOL = customProtocolName || 'wire';
const CORE_PROTOCOL_PREFIX = `${CORE_PROTOCOL}://`;
const CORE_PROTOCOL_POSITION = 1;
const CORE_PROTOCOL_MAX_LENGTH = 1024;

enum ProtocolCommand {
  START_SSO_FLOW = 'start-sso',
}

export class CustomProtocolHandler {
  public hashLocation: string = '';

  async dispatcher(url?: string) {
    if (typeof url === 'undefined' || !url.startsWith(CORE_PROTOCOL_PREFIX) || url.length > CORE_PROTOCOL_MAX_LENGTH) {
      return;
    }

    const route = new URL(url);

    switch (route.host) {
      case ProtocolCommand.START_SSO_FLOW: {
        if (typeof route.pathname === 'string') {
          logger.log('Starting SSO flow...');
          const code = route.pathname.trim().substr(1);
          await app.whenReady();
          WindowManager.sendActionAndFocusWindow(EVENT_TYPE.ACCOUNT.SSO_LOGIN, code);
        }
        break;
      }
      default: {
        const location = route.href.substr(CORE_PROTOCOL_PREFIX.length);
        this.hashLocation = `/${location}`;
        WindowManager.sendActionToPrimaryWindow(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, this.hashLocation);
        break;
      }
    }
  }

  public registerCoreProtocol() {
    if (!app.isDefaultProtocolClient(CORE_PROTOCOL)) {
      app.setAsDefaultProtocolClient(CORE_PROTOCOL);
    }

    if (platform.IS_MAC_OS) {
      app.on('open-url', async (event, url) => {
        event.preventDefault();
        await this.dispatcher(url);
      });
    } else {
      app.once('ready', async () => {
        const url = process.argv[CORE_PROTOCOL_POSITION];
        await this.dispatcher(url);
      });
      app.on('second-instance', async (event, argv) => {
        const url = argv[CORE_PROTOCOL_POSITION];
        await this.dispatcher(url);
      });
    }
  }
}

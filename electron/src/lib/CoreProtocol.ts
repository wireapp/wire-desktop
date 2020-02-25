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

import {app} from 'electron';
import * as path from 'path';
import {URL} from 'url';

import {getLogger} from '../logging/getLogger';
import {platform} from '../runtime/EnvironmentUtil';
import {config} from '../settings/config';
import {WindowManager} from '../window/WindowManager';
import {EVENT_TYPE} from './eventType';

const logger = getLogger(path.basename(__filename));

const CORE_PROTOCOL_PREFIX = `${config.customProtocolName}://`;
const CORE_PROTOCOL_MAX_LENGTH = 1024;

enum ProtocolCommand {
  START_SSO_FLOW = 'start-sso',
}

export class CustomProtocolHandler {
  public hashLocation = '';
  private readonly windowManager = WindowManager;

  async dispatchDeepLink(url?: string): Promise<void> {
    logger.info(`Received deep link "${url}"`);
    if (typeof url === 'undefined' || !url.startsWith(CORE_PROTOCOL_PREFIX) || url.length > CORE_PROTOCOL_MAX_LENGTH) {
      logger.info('Invalid deep link, ignoring');
      return;
    }

    const route = new URL(url);

    if (route.host === ProtocolCommand.START_SSO_FLOW) {
      logger.info('Deep link is a SSO link, triggering SSO login ...');
      await this.handleSSOLogin(route);
    } else {
      logger.info('Triggering hash location change ...');
      this.forwardHashLocation(route);
    }
  }

  private forwardHashLocation(route: URL): void {
    const location = route.href.substr(CORE_PROTOCOL_PREFIX.length);
    this.hashLocation = `/${location}`;
    logger.info(`New hash location: "${this.hashLocation}"`);
    this.windowManager.sendActionToPrimaryWindow(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, this.hashLocation);
  }

  private async handleSSOLogin(route: URL): Promise<void> {
    if (typeof route.pathname === 'string') {
      logger.info('Starting SSO flow ...');
      const code = route.pathname.trim().substr(1);
      try {
        await this.windowManager.sendActionAndFocusWindow(EVENT_TYPE.ACCOUNT.SSO_LOGIN, code);
      } catch (error) {
        logger.error(`Cannot start SSO flow: ${error.message}`, error);
      }
    }
  }

  private findDeepLink(argv: string[]): string | void {
    for (const arg of argv) {
      if (arg.startsWith(CORE_PROTOCOL_PREFIX)) {
        return arg;
      }
    }
  }

  public registerCoreProtocol(): void {
    if (app.isDefaultProtocolClient(config.customProtocolName)) {
      logger.info(`Custom protocol "${config.customProtocolName}" already registered`);
    } else {
      logger.info(`Registering custom protocol "${config.customProtocolName}" ...`);
      app.setAsDefaultProtocolClient(config.customProtocolName);
    }

    if (platform.IS_MAC_OS) {
      app.on('open-url', async (event, url) => {
        event.preventDefault();
        await this.dispatchDeepLink(url);
      });
    } else {
      app.once('ready', async () => {
        logger.info('App ready, looking for deep link in arguments ...');
        const deepLink = this.findDeepLink(process.argv);
        if (deepLink) {
          logger.info('App ready, dispatching deep link ...');
          await this.dispatchDeepLink(deepLink);
        }
      });
      app.on('second-instance', async (_event, argv) => {
        logger.info('Second instance detected, looking for deep link in arguments ...');
        const deepLink = this.findDeepLink(argv);
        if (deepLink) {
          logger.info('Second instance detected, dispatching deep link ...');
          await this.dispatchDeepLink(deepLink);
        }
      });
    }
  }
}

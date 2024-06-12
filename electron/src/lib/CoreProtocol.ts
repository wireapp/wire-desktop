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

import {app, ipcMain} from 'electron';

import * as path from 'path';
import {URL} from 'url';

import {shortenText} from './ElectronUtil';
import {EVENT_TYPE} from './eventType';

import {showErrorDialog} from '../lib/showDialog';
import {getLogger} from '../logging/getLogger';
import {platform} from '../runtime/EnvironmentUtil';
import {config} from '../settings/config';
import {WindowManager} from '../window/WindowManager';

const logger = getLogger(path.basename(__filename));

const CORE_PROTOCOL_PREFIX = `${config.customProtocolName}://`;
const CORE_PROTOCOL_MAX_LENGTH = 1024;
const START_SSO_FLOW = 'start-sso';
const JOIN_CONVERSATION_FLOW = 'conversation-join';
const START_LOGIN_FLOW = 'start-login';

export class CustomProtocolHandler {
  public hashLocation = '';
  private readonly windowManager = WindowManager;

  private async dispatchDeepLink(url?: string): Promise<void> {
    logger.info('Dispatching deep link ...');
    try {
      if (
        typeof url === 'undefined' ||
        !url.startsWith(CORE_PROTOCOL_PREFIX) ||
        url.length > CORE_PROTOCOL_MAX_LENGTH
      ) {
        showErrorDialog(`Invalid deep link "${shortenText(url || '', CORE_PROTOCOL_MAX_LENGTH)}."`);
        logger.info('Invalid deep link, ignoring');
        return;
      }

      const route = new URL(url);

      if (route.host === START_SSO_FLOW) {
        logger.info('Deep link is a SSO link, triggering SSO login ...');
        await this.handleSSOLogin(route);
      } else if (route.host === JOIN_CONVERSATION_FLOW) {
        logger.info('Deep link is a conversation join link, triggering join ...');
        await this.handleJoinConversation(route);
      } else if (route.host === START_LOGIN_FLOW) {
        logger.info('Deep link is a start login link, triggering new account ...');
        await this.handleStartLogin(route);
      } else {
        // handle invalid deep link
        logger.info('Triggering hash location change ...');
        this.forwardHashLocation(route);
      }
    } catch (error: any) {
      logger.error(error);
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
      } catch (error: any) {
        logger.error(`Cannot start SSO flow: ${error.message}`, error);
      }
    }
  }

  private async handleJoinConversation(route: URL): Promise<void> {
    if (typeof route.pathname === 'string') {
      logger.info('Joining conversation ...');
      const code = route.searchParams.get('code');
      const key = route.searchParams.get('key');
      const domain = route.searchParams.get('domain');

      try {
        await this.windowManager.sendActionAndFocusWindow(EVENT_TYPE.ACTION.JOIN_CONVERSATION, {code, key, domain});
      } catch (error: any) {
        logger.error(`Cannot join conversation: ${error.message}`, error);
      }
    }
  }

  private async handleStartLogin(route: URL): Promise<void> {
    if (typeof route.pathname === 'string') {
      logger.info('Starting login flow ...');

      try {
        await this.windowManager.sendActionAndFocusWindow(EVENT_TYPE.ACTION.START_LOGIN);
      } catch (error: any) {
        logger.error(`Cannot start login flow: ${(error as Error).message}`, error);
      }
    }
  }

  private findDeepLink(argv: string[]): string | void {
    return argv.find(arg => arg.startsWith(CORE_PROTOCOL_PREFIX));
  }

  public registerCoreProtocol(): void {
    if (app.isDefaultProtocolClient(config.customProtocolName)) {
      logger.info(`Custom protocol "${config.customProtocolName}" already registered`);
    } else {
      logger.info(`Registering custom protocol "${config.customProtocolName}" ...`);
      app.setAsDefaultProtocolClient(config.customProtocolName);
    }

    ipcMain.on(EVENT_TYPE.ACTION.DEEP_LINK_SUBMIT, async (_event, url: string) => this.dispatchDeepLink(url));

    app.on('open-url', async (event, url) => {
      event.preventDefault();
      await this.dispatchDeepLink(url);
    });
    app.once('ready', async () => {
      logger.info('App ready, looking for deep link in arguments ...');
      const deepLink = this.findDeepLink(process.argv);
      if (deepLink) {
        await this.dispatchDeepLink(deepLink);
      } else {
        logger.info('No deep link found in arguments.');
      }
    });
    if (!platform.IS_MAC_OS) {
      app.on('second-instance', async (_event, argv) => {
        logger.info('Second instance detected, looking for deep link in arguments ...');
        const deepLink = this.findDeepLink(argv);
        if (deepLink) {
          await this.dispatchDeepLink(deepLink);
        } else {
          logger.info('No deep link found in arguments.');
        }
      });
    }
  }
}

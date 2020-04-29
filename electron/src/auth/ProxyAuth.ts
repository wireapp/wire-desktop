/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import * as path from 'path';
import {URL} from 'url';

import {getLogger} from '../logging/';

const logger = getLogger(path.basename(__filename));

interface AuthInfo {
  host: string;
  port: number;
}

interface ProxyOptions {
  password?: string;
  protocol?: string;
  username?: string;
}

function generateProxyURL(authInfo: AuthInfo, options: ProxyOptions): URL {
  let protocol = options.protocol;
  const {username, password} = options;

  if (!protocol) {
    logger.log('Default to HTTP proxy');
    protocol = 'http';
  }

  const proxySettings = new URL(`${protocol}://${authInfo.host}`);
  if (authInfo.port) {
    proxySettings.port = authInfo.port.toString();
    logger.log('Port set');
  }
  logger.log(`Proxy URL: (credentials hidden) ${proxySettings.toString()}`);

  if (username) {
    proxySettings.username = username;
    logger.log('Username set');
  }
  if (password) {
    proxySettings.password = password;
    logger.log('Password set');
  }

  return proxySettings;
}

const ProxyAuth = {
  generateProxyURL,
};

export default ProxyAuth;

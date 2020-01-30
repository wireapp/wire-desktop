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

import * as assert from 'assert';

import ProxyAuth from './ProxyAuth';
import {Protocol} from 'get-proxy-settings';

describe('ProxyAuth', () => {
  it("generates a proxy URL using the operating system's proxy settings", () => {
    const authInfo = {
      host: 'wireproxy.com',
      isProxy: true,
      port: 8080,
      realm: '',
      scheme: 'https',
    };

    const options = {
      password: 'secret',
      protocol: Protocol.Https,
      username: 'top',
    };

    const url = ProxyAuth.generateProxyURL(authInfo, options);
    assert.ok(url.toString() === 'https://top:secret@wireproxy.com:8080/');
  });

  it('supports special characters like slashes in passwords', () => {
    const authInfo = {
      host: 'wireproxy.com',
      isProxy: true,
      port: 8080,
      realm: '',
      scheme: 'https',
    };

    const url = ProxyAuth.generateProxyURL(authInfo, {
      password: 'sec/ret',
      protocol: Protocol.Https,
      username: 'top',
    });
    assert.ok(url.toString() === 'https://top:secret@wireproxy.com:8080/');
  });
});

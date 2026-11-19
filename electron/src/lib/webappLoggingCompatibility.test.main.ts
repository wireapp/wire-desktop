/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import {strict as assert} from 'node:assert';

import {createWebappUrlWithLoggingCompatibility} from './webappLoggingCompatibility';

describe('Webapp logging URL compatibility', () => {
  it('sets the logging parameters and preserves the rest of the URL', () => {
    const baseUrl =
      'https://example.test/auth/?hl=de&id=account&enabled-features=desktop-structured-logs,persistent-browser-logs#login';
    const expectedUrl = new URL(baseUrl);
    expectedUrl.searchParams.set('enableLogging', '@wireapp/*');
    expectedUrl.searchParams.set('debugLogging', '');

    const actualUrl = createWebappUrlWithLoggingCompatibility(baseUrl);

    assert.equal(actualUrl.href, expectedUrl.href);
    assert.equal(actualUrl.searchParams.get('debugLogging'), '');
  });

  for (const debugSelection of ['', '-*', '*', '@wireapp/*,-@wireapp/core/*']) {
    it(`preserves the explicit debugLogging selection "${debugSelection}"`, () => {
      const baseUrl = new URL('https://example.test/');
      baseUrl.searchParams.set('enableLogging', 'previous-selection');
      baseUrl.searchParams.set('debugLogging', debugSelection);

      const actualUrl = createWebappUrlWithLoggingCompatibility(baseUrl.href);

      assert.deepEqual(actualUrl.searchParams.getAll('debugLogging'), [debugSelection]);
      assert.equal(actualUrl.searchParams.get('enableLogging'), '@wireapp/*');
    });
  }
});

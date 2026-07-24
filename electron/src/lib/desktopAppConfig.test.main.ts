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

import assert from 'node:assert';

import {createDesktopAppConfig} from './desktopAppConfig';

describe('createDesktopAppConfig', () => {
  it('exposes support for refreshing existing webviews', () => {
    const desktopAppConfig = createDesktopAppConfig('3.42.0', {applockOverride: false});

    assert.strictEqual(desktopAppConfig.supportsWebViewRefresh, true);
  });
});

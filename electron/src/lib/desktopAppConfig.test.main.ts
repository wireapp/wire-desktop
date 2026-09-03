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
  it('exposes the supplied regional locale unchanged', () => {
    const desktopAppConfig = createDesktopAppConfig({
      managedConfig: {applockOverride: false},
      regionalLocale: 'de-DE',
      version: '3.42.0',
    });

    assert.strictEqual(desktopAppConfig.regionalLocale, 'de-DE');
  });

  it('preserves the existing version, managed config and capability flags', () => {
    const desktopAppConfig = createDesktopAppConfig({
      managedConfig: {applockOverride: true},
      version: '3.42.0',
    });

    assert.strictEqual(desktopAppConfig.version, '3.42.0');
    assert.deepStrictEqual(desktopAppConfig.managedConfig, {applockOverride: true});
    assert.strictEqual(desktopAppConfig.supportsCallingPopoutWindow, true);
    assert.strictEqual(desktopAppConfig.supportsWebViewRefresh, true);
  });

  it('leaves the regional locale absent when it is not supplied', () => {
    const desktopAppConfig = createDesktopAppConfig({
      managedConfig: {applockOverride: false},
      version: '3.42.0',
    });

    assert.strictEqual(desktopAppConfig.regionalLocale, undefined);
  });
});

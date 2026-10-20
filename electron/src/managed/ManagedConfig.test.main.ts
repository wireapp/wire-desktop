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

import {fake, replace, restore} from 'sinon';

import * as assert from 'assert';

import * as macosBackend from './backends/macos';
import * as windowsBackend from './backends/windows';
import {clearManagedConfigCache, getManagedConfig} from './ManagedConfig';

import * as EnvironmentUtil from '../runtime/EnvironmentUtil';

describe('getManagedConfig', () => {
  beforeEach(() => {
    clearManagedConfigCache();
  });

  afterEach(() => {
    restore();
    clearManagedConfigCache();
  });

  it('memoizes the result and reads the underlying source only once', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: true, IS_MAC_OS: false});
    const backendCall = fake.returns(false);
    replace(windowsBackend, 'isDeviceManagedWindows', backendCall as any);
    getManagedConfig();
    getManagedConfig();
    assert.strictEqual(backendCall.callCount, 1);
  });

  it('never throws and defaults to disabled on an unrecognized platform', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: false});
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });

  it('enables the override on Windows when a managed config payload is present', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: true, IS_MAC_OS: false});
    replace(windowsBackend, 'isDeviceManagedWindows', fake.returns(true) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: true});
  });

  it('disables the override on Windows when no managed config is present', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: true, IS_MAC_OS: false});
    replace(windowsBackend, 'isDeviceManagedWindows', fake.returns(false) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });

  it('enables the override on macOS when a managed config payload is present', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: true});
    replace(macosBackend, 'isDeviceManagedMacOS', fake.returns(true) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: true});
  });

  it('disables the override on macOS when no managed config is present', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: true});
    replace(macosBackend, 'isDeviceManagedMacOS', fake.returns(false) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });
});

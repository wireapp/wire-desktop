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

import * as linuxBackend from './backends/linux';
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

  it('enables the override when a managed config payload is present', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: false, IS_LINUX: true});
    replace(linuxBackend, 'isDeviceManagedLinux', fake.returns(true) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: true});
  });

  it('disables the override when no managed config is present', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: false, IS_LINUX: true});
    replace(linuxBackend, 'isDeviceManagedLinux', fake.returns(false) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });

  it('treats a present payload as enabled unless it explicitly opts out', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: false, IS_LINUX: true});
    replace(linuxBackend, 'isDeviceManagedLinux', fake.returns(false) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });

  it('memoizes the result and reads the underlying source only once', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: false, IS_LINUX: true});
    const backendCall = fake.returns(false);
    replace(linuxBackend, 'isDeviceManagedLinux', backendCall as any);
    getManagedConfig();
    getManagedConfig();
    assert.strictEqual(backendCall.callCount, 1);
  });

  it('never throws and defaults to disabled on an unrecognized platform', () => {
    replace(EnvironmentUtil, 'platform', {IS_WINDOWS: false, IS_MAC_OS: false, IS_LINUX: false});
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });
});

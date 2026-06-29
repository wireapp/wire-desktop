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

import * as fs from 'fs-extra';
import {fake, replace, restore} from 'sinon';

import * as assert from 'assert';

import {clearManagedConfigCache, getManagedConfig} from './ManagedConfig';

import * as EnvironmentUtil from '../runtime/EnvironmentUtil';

describe('getManagedConfig', () => {
  beforeEach(() => {
    clearManagedConfigCache();
    // Force the Linux code path so the test is deterministic regardless of the host OS.
    replace(EnvironmentUtil.platform, 'IS_WINDOWS', false);
    replace(EnvironmentUtil.platform, 'IS_MAC_OS', false);
    replace(EnvironmentUtil.platform, 'IS_LINUX', true);
  });

  afterEach(() => {
    restore();
    clearManagedConfigCache();
  });

  it('enables the override when a managed config payload is present', () => {
    replace(fs, 'readJSONSync', fake.returns({applockOverride: true}) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: true});
  });

  it('disables the override when no managed config is present', () => {
    replace(fs, 'readJSONSync', fake.throws(new Error('ENOENT')) as any);
    replace(fs, 'pathExistsSync', fake.returns(false) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });

  it('treats a present payload as enabled unless it explicitly opts out', () => {
    replace(fs, 'readJSONSync', fake.returns({applockOverride: false}) as any);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });

  it('memoizes the result and reads the underlying source only once', () => {
    const readSource = fake.returns({applockOverride: true});
    replace(fs, 'readJSONSync', readSource as any);
    getManagedConfig();
    getManagedConfig();
    assert.strictEqual(readSource.callCount, 1);
  });

  it('never throws and defaults to disabled on an unrecognized platform', () => {
    replace(EnvironmentUtil.platform, 'IS_LINUX', false);
    assert.deepStrictEqual(getManagedConfig(), {applockOverride: false});
  });
});

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
 */

import * as assert from 'assert';

import {normalizeBuildPlatform} from './build-platform';

describe('normalizeBuildPlatform', () => {
  it('selects supported Windows and macOS build commands', () => {
    const actualPlatforms = ['win', 'windows', 'windows-installer', 'windows-msi', 'windows-msi-alias', 'mac', 'macos'].map(
      normalizeBuildPlatform,
    );
    const expectedPlatforms = [
      'windows',
      'windows',
      'windows-installer',
      'windows-msi',
      'windows-msi-alias',
      'macos',
      'macos',
    ];

    assert.deepStrictEqual(actualPlatforms, expectedPlatforms);
  });

  it('does not select Linux or unknown build commands', () => {
    assert.strictEqual(normalizeBuildPlatform('linux'), undefined);
    assert.strictEqual(normalizeBuildPlatform('freebsd'), undefined);
  });
});

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

import * as assert from 'assert';

import {LogFileMetadata, planLogCleanup} from './logRetention';

const currentTimeMilliseconds = 1_000_000;
const maximumAgeMilliseconds = 7 * 24 * 60 * 60 * 1_000;
const maximumTotalSizeBytes = 100;

function createFileMetadata(
  filePath: string,
  fileSizeBytes: number,
  modifiedTimeMilliseconds: number,
  isSymbolicLink: boolean,
): LogFileMetadata {
  return {filePath, fileSizeBytes, isSymbolicLink, modifiedTimeMilliseconds};
}

describe('desktop log retention planner', () => {
  it('removes files older than the configured age', () => {
    const files = [
      createFileMetadata('expired.log', 10, currentTimeMilliseconds - maximumAgeMilliseconds - 1, false),
      createFileMetadata('recent.log', 10, currentTimeMilliseconds - maximumAgeMilliseconds, false),
    ];

    const actualPlan = planLogCleanup({
      activeFilePaths: new Set(),
      currentTimeMilliseconds,
      files,
      policy: {maximumAgeMilliseconds, maximumTotalSizeBytes},
    });
    const expectedFilesToDelete = ['expired.log'];

    assert.deepStrictEqual(actualPlan.filesToDelete, expectedFilesToDelete);
  });

  it('preserves active files and symbolic links', () => {
    const files = [
      createFileMetadata('active.log', 200, currentTimeMilliseconds - maximumAgeMilliseconds - 1, false),
      createFileMetadata('link.log', 200, currentTimeMilliseconds - maximumAgeMilliseconds - 1, true),
      createFileMetadata('eligible.log', 10, currentTimeMilliseconds - maximumAgeMilliseconds - 1, false),
    ];

    const actualPlan = planLogCleanup({
      activeFilePaths: new Set(['active.log']),
      currentTimeMilliseconds,
      files,
      policy: {maximumAgeMilliseconds, maximumTotalSizeBytes},
    });
    const expectedFilesToDelete = ['eligible.log'];

    assert.deepStrictEqual(actualPlan.filesToDelete, expectedFilesToDelete);
  });

  it('removes the oldest eligible files until the total size is within the limit', () => {
    const files = [
      createFileMetadata('newest.log', 80, 30, false),
      createFileMetadata('oldest.log', 80, 10, false),
      createFileMetadata('middle.log', 80, 20, false),
    ];

    const actualPlan = planLogCleanup({
      activeFilePaths: new Set(),
      currentTimeMilliseconds,
      files,
      policy: {maximumAgeMilliseconds, maximumTotalSizeBytes},
    });
    const expectedFilesToDelete = ['oldest.log', 'middle.log'];

    assert.deepStrictEqual(actualPlan.filesToDelete, expectedFilesToDelete);
  });

  it('uses the path as a deterministic tie-breaker', () => {
    const files = [createFileMetadata('zeta.log', 60, 10, false), createFileMetadata('alpha.log', 60, 10, false)];

    const actualPlan = planLogCleanup({
      activeFilePaths: new Set(),
      currentTimeMilliseconds,
      files,
      policy: {maximumAgeMilliseconds, maximumTotalSizeBytes},
    });
    const expectedFilesToDelete = ['alpha.log'];

    assert.deepStrictEqual(actualPlan.filesToDelete, expectedFilesToDelete);
  });
});

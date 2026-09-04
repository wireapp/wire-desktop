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

import fs from 'fs-extra';

import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';

import {isSquirrelInstallation} from './squirrelInstallation';

describe('Squirrel updater', () => {
  const testDirectory = path.join(os.tmpdir(), `wire-squirrel-test-${process.pid}`);
  const updaterPath = path.join(testDirectory, 'Update.exe');

  afterEach(async () => fs.remove(testDirectory));

  it('recognizes a Squirrel installation by its updater executable', async () => {
    await fs.ensureFile(updaterPath);

    assert.strictEqual(isSquirrelInstallation(updaterPath), true);
  });

  it('does not treat an MSI installation as Squirrel', () => {
    assert.strictEqual(isSquirrelInstallation(updaterPath), false);
  });
});

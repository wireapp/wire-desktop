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

import fs from 'node:fs';
import path from 'node:path';

import assert from 'node:assert';

const repositoryRoot = path.resolve(process.cwd());
const deploymentPipeline = fs.readFileSync(path.join(repositoryRoot, 'jenkins/deployment.groovy'), 'utf8');

describe('Jenkins Windows deployment', () => {
  it('updates the Squirrel feed whenever a complete Squirrel artifact set is present', () => {
    assert.doesNotMatch(deploymentPipeline, /\bisWindowsMsi\b/);
    assert.match(deploymentPipeline, /if \(hasWindowsSquirrel\) \{\s+stage\('Update RELEASES file'\)/);
  });
});

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
import fs from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(process.cwd());
const deploymentPipeline = fs.readFileSync(path.join(repositoryRoot, 'jenkins/deployment.groovy'), 'utf8');

describe('Jenkins Windows deployment', () => {
  it('requires the primary Squirrel artifact set before deploying Windows artifacts', () => {
    assert.match(
      deploymentPipeline,
      /if \(!hasWindowsSquirrel\) \{\s+error\('No complete Windows Squirrel artifact set found'\)/,
    );
  });

  it('updates the Squirrel feed whenever a complete Squirrel artifact set is present', () => {
    assert.doesNotMatch(deploymentPipeline, /\bisWindowsMsi\b/);
    assert.match(deploymentPipeline, /if \(hasWindowsSquirrel\) \{\s+stage\('Update RELEASES file'\)/);
  });

  it('requires the exact production MSI only when the copied build carries the MSI requirement manifest', () => {
    assert.match(deploymentPipeline, /def windowsMsiRequirementManifest = 'wrap\/dist\/windows-msi-required'/);
    assert.match(deploymentPipeline, /params\.Release == 'Production' &&\s+hasWindowsMsiRequirementManifest/);
    assert.match(deploymentPipeline, /Wire-\$\{version\}-x64\.msi/);
    assert.match(
      deploymentPipeline,
      /Required production Windows MSI '\$\{expectedWindowsMsiFileName\}' is missing from copied build artifacts/,
    );
  });

  it('passes the exact production MSI selection to the uploader and fails the deployment on upload errors', () => {
    assert.match(deploymentPipeline, /--windows-artifact msi \\\s+--expected-windows-msi "\$EXPECTED_WINDOWS_MSI"/);
    assert.match(deploymentPipeline, /catch\(e\) \{\s+currentBuild\.result = 'FAILED'[\s\S]*?throw e/);
  });
});

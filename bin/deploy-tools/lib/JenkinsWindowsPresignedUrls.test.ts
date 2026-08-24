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

const deploymentPipeline = fs.readFileSync(path.resolve(process.cwd(), 'jenkins/deployment.groovy'), 'utf8');

describe('Jenkins Windows presigned URLs', () => {
  it('uses the dedicated MSI prefix when generating MSI presigned URLs', () => {
    assert.match(
      deploymentPipeline,
      /def s3PathForArtifact\([^)]*\) \{[\s\S]*?projectName\.contains\('Windows'\)[\s\S]*?artifactName\.toLowerCase\(\)\.endsWith\('\.msi'\)[\s\S]*?return windowsMsiPath[\s\S]*?return defaultPath[\s\S]*?\}/,
    );
    assert.strictEqual((deploymentPipeline.match(/s3PathForArtifact\(projectName, fileObj\.name,/g) || []).length, 2);
    assert.strictEqual(
      (
        deploymentPipeline.match(
          /aws s3 presign s3:\/\/\$\{env\.S3_BUCKET\}\/\$\{artifactS3Path\}\/\$\{fileObj\.name\}/g,
        ) || []
      ).length,
      2,
    );
  });
});

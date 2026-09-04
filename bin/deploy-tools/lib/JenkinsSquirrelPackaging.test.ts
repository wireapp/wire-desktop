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
const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'));
const windowsPipeline = fs.readFileSync(path.join(repositoryRoot, 'jenkins/windows.groovy'), 'utf8');

describe('Jenkins Squirrel packaging', () => {
  it('builds a clean MSI before Squirrel mutates the application directory', () => {
    assert.strictEqual(
      packageJson.scripts['build:win:installers'],
      'rimraf wrap/dist && yarn build:win:msi:package -m && yarn build:win:installer:package',
    );
    assert.strictEqual(
      packageJson.scripts['build:win:installers:manual'],
      'rimraf wrap/dist && yarn build:win:msi:package -m && yarn build:win:installer:package -m',
    );
    const signApplicationStage = windowsPipeline.indexOf("stage('Sign application')");
    const buildInstallersStage = windowsPipeline.indexOf("stage('Build installers')");
    assert.ok(signApplicationStage >= 0 && signApplicationStage < buildInstallersStage);
    assert.match(
      windowsPipeline,
      /if \(production \|\| custom\) \{\s+bat 'yarn build:win:installers'\s+\} else \{\s+bat 'yarn build:win:installers:manual'/,
    );
  });
});

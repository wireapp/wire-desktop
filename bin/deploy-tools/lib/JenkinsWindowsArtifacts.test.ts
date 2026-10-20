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

const windowsPipeline = fs.readFileSync(path.resolve(process.cwd(), 'jenkins/windows.groovy'), 'utf8');
const githubDraftCli = fs.readFileSync(path.resolve(process.cwd(), 'bin/deploy-tools/github-draft-cli.ts'), 'utf8');

describe('Jenkins Windows build artifacts', () => {
  it('fails the build unless both complete installer families were produced', () => {
    for (const artifact of ['*-Setup.exe', '*-full.nupkg', 'RELEASES', '*.msi']) {
      assert.ok(
        windowsPipeline.includes(`if not exist "wrap\\\\dist\\\\${artifact}"`),
        `Missing an explicit Jenkins artifact gate for ${artifact}`,
      );
    }
  });

  it('creates and verifies the generic MSI alias after installer verification and before archiving', () => {
    const verificationStagePosition = windowsPipeline.indexOf("stage('verify')");
    const aliasCreationPosition = windowsPipeline.indexOf('windows-msi-alias');
    const aliasVerificationPosition = windowsPipeline.indexOf('signtool.exe verify', aliasCreationPosition);
    const archiveStagePosition = windowsPipeline.indexOf("stage('Archive build artifacts')");

    assert.ok(verificationStagePosition < aliasCreationPosition);
    assert.ok(aliasCreationPosition < aliasVerificationPosition);
    assert.ok(aliasVerificationPosition < archiveStagePosition);
    assert.ok(windowsPipeline.includes('windows-msi-alias --expected-version ${version}'));
    assert.ok(windowsPipeline.includes('Missing generic MSI Setup alias'));
  });

  it('allows the existing GitHub release uploader to attach MSI build artifacts', () => {
    assert.ok(githubDraftCli.includes('extensions.push(FileExtension.EXE, FileExtension.MSI)'));
    assert.ok(githubDraftCli.includes('files.filter(fileName => endsWithAny(extensions, fileName))'));
  });
});

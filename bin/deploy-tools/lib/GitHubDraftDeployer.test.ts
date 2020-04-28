/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import assert from 'assert';
import path from 'path';

import {GitHubDraftDeployer} from './GitHubDraftDeployer';

describe('GitHubDraftDeployer', () => {
  describe('createDraft', () => {
    it(`doesn't upload anything if dry run is set`, async () => {
      const gitHubDraftDeployer = new GitHubDraftDeployer({
        dryRun: true,
        githubToken: '',
        repoSlug: 'wireapp/wire-desktop',
      });

      const result = await gitHubDraftDeployer.createDraft({changelog: '', commitOrBranch: '', tagName: '', title: ''});
      assert.deepStrictEqual(result, {id: 0});
    });
  });

  describe('uploadAsset', () => {
    it(`doesn't upload anything if dry run is set`, async () => {
      const gitHubDraftDeployer = new GitHubDraftDeployer({
        dryRun: true,
        githubToken: '',
        repoSlug: 'wireapp/wire-desktop',
      });

      await gitHubDraftDeployer.uploadAsset({draftId: 0, fileName: path.basename(__filename), filePath: __filename});
    });
  });
});

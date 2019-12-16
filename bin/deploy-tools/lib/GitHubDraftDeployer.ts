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

import axios from 'axios';
import fs from 'fs-extra';
import logdown from 'logdown';

import {logDry, TWO_HUNDRED_MB_IN_BYTES} from './deploy-utils';

/** @see https://developer.github.com/v3/repos/releases/#create-a-release */
export interface GitHubAPIDraftData {
  assets_url: string;
  body: string;
  created_at: string;
  draft: boolean;
  html_url: string;
  id: number;
  name: string;
  node_id: string;
  prerelease: boolean;
  published_at: string;
  tag_name: string;
  tarball_url: string;
  target_commitish: string;
  upload_url: string;
  url: string;
  zipball_url: string;
}

/** @see https://developer.github.com/v3/repos/releases/#create-a-release */
interface GitHubAPICreateDraftOptions {
  /** Text describing the contents of the tag. */
  body?: string;
  /**
   * `true` to create a draft (unpublished) release,
   * `false` to create a published one. Default: `false`
   */
  draft?: boolean;
  /** The name of the release. */
  name?: string;
  /**
   * `true` to identify the release as a prerelease.
   * `false` to identify the release as a full release. Default: `false`
   */
  prerelease?: boolean;
  /** **Required**. The name of the tag. */
  tag_name: string;
  /**
   * Specifies the commitish value that determines where the Git tag is created from.
   * Can be any branch or commit SHA. Unused if the Git tag already exists.
   * Default: the repository's default branch (usually `master`).
   */
  target_commitish?: string;
}

export interface GitHubDraftDeployerOptions {
  dryRun?: boolean;
  githubToken: string;
  repoSlug: string;
}

export interface GitHubDraftOptions {
  changelog: string;
  commitOrBranch: string;
  tagName: string;
  title: string;
}

export interface GitHubUploadOptions {
  draftId: number;
  fileName: string;
  filePath: string;
}

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_UPLOADS_URL = 'https://uploads.github.com';

export class GitHubDraftDeployer {
  private readonly options: Required<GitHubDraftDeployerOptions>;
  private readonly logger: logdown.Logger;

  constructor(options: GitHubDraftDeployerOptions) {
    this.options = {
      dryRun: false,
      ...options,
    };
    this.logger = logdown('@wireapp/deploy-tools/GitHubDraftDeployer', {
      logger: console,
      markdown: false,
    });
  }

  async createDraft(options: GitHubDraftOptions): Promise<GitHubAPIDraftData | {id: 0}> {
    const {changelog, commitOrBranch: commitish, tagName, title} = options;
    const {repoSlug, githubToken} = this.options;

    const draftUrl = `${GITHUB_API_URL}/repos/${repoSlug}/releases`;

    const draftData: GitHubAPICreateDraftOptions = {
      body: changelog,
      draft: true,
      name: title,
      prerelease: false,
      tag_name: tagName,
      target_commitish: commitish,
    };

    const AuthorizationHeaders = {
      Authorization: `token ${githubToken}`,
    };

    if (this.options.dryRun) {
      logDry('createDraft', {draftData, url: draftUrl});
      return {id: 0};
    }

    try {
      const draftResponse = await axios.post<GitHubAPIDraftData>(draftUrl, draftData, {headers: AuthorizationHeaders});
      return draftResponse.data;
    } catch (error) {
      this.logger.error('Error response from GitHub:', error.response.data);
      throw new Error(
        `Draft creation failed with status code "${error.response.status}": "${error.response.statusText}"`,
      );
    }
  }

  async uploadAsset(options: GitHubUploadOptions): Promise<void> {
    const {draftId, fileName, filePath} = options;
    const {repoSlug, githubToken} = this.options;

    const draftUrl = `${GITHUB_API_URL}/repos/${repoSlug}/releases`;
    const uploadUrl = `${GITHUB_UPLOADS_URL}/repos/${repoSlug}/releases/${draftId}/assets`;

    const AuthorizationHeaders = {
      Authorization: `token ${githubToken}`,
    };

    const headers = {
      ...AuthorizationHeaders,
      'Content-type': 'application/binary',
    };
    const file = await fs.readFile(filePath);
    const url = `${uploadUrl}?name=${fileName}`;

    if (this.options.dryRun) {
      logDry('uploadAsset', {file, headers, maxContentLength: TWO_HUNDRED_MB_IN_BYTES, url});
      return;
    }

    try {
      await axios.post(url, file, {headers, maxContentLength: TWO_HUNDRED_MB_IN_BYTES});
    } catch (uploadError) {
      this.logger.error('Error response from GitHub:', uploadError.response.data);
      this.logger.error(
        `Upload failed with status code "${uploadError.response.status}": ${uploadError.response.statusText}"`,
      );
      this.logger.info('Deleting draft because upload failed ...');

      try {
        await axios.delete(draftUrl, {headers: AuthorizationHeaders});
        this.logger.info('Draft deleted');
      } catch (deleteError) {
        this.logger.error('Error response from GitHub:', deleteError.response.data);
        throw new Error(
          `Deletion failed with status code "${deleteError.response.status}: ${deleteError.response.statusText}"`,
        );
      } finally {
        throw new Error('Uploading asset failed');
      }
    }
  }
}

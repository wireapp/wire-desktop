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

import axios, {AxiosError} from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import logdown from 'logdown';
import path from 'path';

import {logDry, TWO_HUNDRED_MB_IN_BYTES} from './deploy-utils';

const HOCKEY_API_URL = 'https://rink.hockeyapp.net/api/2/apps';

export interface HockeyOptions {
  dryRun?: boolean;
  hockeyAppId: string;
  hockeyToken: string;
  version: string;
}

export interface HockeyUploadOptions {
  filePath: string;
  hockeyVersionId: number | string;
}

export interface HockeyAPIVersionData {
  config_url: string;
  id: string;
  public_url: string;
  shortversion: string;
  status: 1 | 2;
  timestamp: number;
  title: string;
  version: string;
}

/** @see https://support.hockeyapp.net/kb/api/ */
interface HockeyAPIOptions {
  /** optional, release notes as Textile or Markdown (after 5k characters notes are truncated) */
  notes?: string;
  /**
   * optional, type of release notes:
   * * `0`: Textile
   * * `1`: Markdown
   */
  notes_type?: 0 | 1;
  /**
   * optional, download status (can only be set with full-access tokens):
   * * `1`: Don't allow users to download or install the version
   * * `2`: Available for download or installation
   */
  status?: 1 | 2;
}

/** @see https://support.hockeyapp.net/kb/api/api-versions#create-version */
interface HockeyAPICreateVersionOptions extends HockeyAPIOptions {
  /** optional, set to CFBundleShortVersionString (iOS and OS X) or to versionName (Android) */
  bundle_short_version?: string;
  /** mandatory, set to CFBundleVersion (iOS and OS X) or to versionCode (Android) */
  bundle_version: string;
}

/** @see https://support.hockeyapp.net/kb/api/api-versions#update-version */
interface HockeyAPIUpdateVersionOptions extends HockeyAPIOptions {
  /**
   * optional, notify testers (can only be set with full-access tokens):
   * * `0`: Don't notify testers
   * * `1`: Notify all testers that can install this app
   */
  notify?: 0 | 1;
}

export class HockeyDeployer {
  private readonly options: Required<HockeyOptions>;
  private readonly logger: logdown.Logger;

  constructor(options: HockeyOptions) {
    this.options = {
      dryRun: false,
      ...options,
    };
    this.logger = logdown('@wireapp/deploy-tools/HockeyDeployer', {
      logger: console,
      markdown: false,
    });
  }

  async createVersion(): Promise<HockeyAPIVersionData | {id: 0}> {
    const {hockeyAppId, hockeyToken, version} = this.options;
    const [majorVersion, minorVersion, patchVersion] = version.split('.');

    const hockeyUrl = `${HOCKEY_API_URL}/${hockeyAppId}/app_versions/new`;

    const headers = {
      'X-HockeyAppToken': hockeyToken,
    };

    const postData: HockeyAPICreateVersionOptions = {
      bundle_short_version: `${majorVersion}.${minorVersion}`,
      bundle_version: patchVersion,
      notes: 'Jenkins Build',
    };

    if (this.options.dryRun) {
      logDry('createVersion', {hockeyUrl, postData});
      return {id: 0};
    }

    try {
      const response = await axios.post<HockeyAPIVersionData>(hockeyUrl, postData, {headers});
      return response.data;
    } catch (error) {
      this.logger.error(error);
      const {status, statusText} = (error as AxiosError).response || {};
      throw new Error(`Hockey version creation failed with status code "${status}": "${statusText}"`);
    }
  }

  async uploadVersion(uploadOptions: HockeyUploadOptions): Promise<void> {
    const {filePath, hockeyVersionId} = uploadOptions;
    const {hockeyAppId, hockeyToken} = this.options;
    const resolvedFile = path.resolve(filePath);

    const hockeyUrl = `${HOCKEY_API_URL}/${hockeyAppId}/app_versions/${hockeyVersionId}`;

    const postData: HockeyAPIUpdateVersionOptions = {
      notify: 0,
      status: 2,
    };

    const readStream = fs.createReadStream(resolvedFile).on('error', error => {
      throw error;
    });
    const formData = new FormData();

    Object.entries(postData).forEach(([key, value]) => formData.append(key, value));
    formData.append('files', readStream);

    const headers = {
      ...formData.getHeaders(),
      'X-HockeyAppToken': hockeyToken,
    };

    if (this.options.dryRun) {
      logDry('uploadVersion', {hockeyUrl, postData});
      return;
    }

    try {
      await axios.put<void>(hockeyUrl, formData, {headers, maxContentLength: TWO_HUNDRED_MB_IN_BYTES});
    } catch (error) {
      this.logger.error(error);
      const {status, statusText} = (error as AxiosError).response || {};
      throw new Error(`Hockey version upload failed with status code "${status}": "${statusText}"`);
    }
  }
}

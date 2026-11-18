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

import {normalizeS3DirectoryPrefix} from './deploy-utils';
import {S3CopyOptions, windowsReleaseAliasCacheControl} from './S3Deployer';

interface PublishWindowsSquirrelReleaseOptions {
  bucket: string;
  copyOnS3: (copyOptions: S3CopyOptions) => Promise<void>;
  s3Prefix?: string;
  setupName: string;
  versionedName: string;
}

export async function publishWindowsSquirrelRelease(options: PublishWindowsSquirrelReleaseOptions): Promise<void> {
  const {bucket, copyOnS3, s3Prefix, setupName, versionedName} = options;
  const directory = normalizeS3DirectoryPrefix(s3Prefix);
  const versionedSource = `${bucket}/${directory}${versionedName}`;

  await copyOnS3({
    bucket,
    cacheControl: windowsReleaseAliasCacheControl,
    s3FromPath: `${versionedSource}-RELEASES`,
    s3ToPath: `${directory}RELEASES`,
  });
  await copyOnS3({
    bucket,
    cacheControl: windowsReleaseAliasCacheControl,
    s3FromPath: `${versionedSource}.exe`,
    s3ToPath: `${directory}${setupName}`,
  });
}

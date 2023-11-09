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

import {Logger} from '@wireapp/commons';
import {getLogger} from '../../bin-utils';
import S3 from 'aws-sdk/clients/s3';
import fs from 'fs-extra';
import path from 'path';

import {find, FindResult, logDry} from './deploy-utils';

export interface S3DeployerOptions {
  accessKeyId: string;
  dryRun?: boolean;
  secretAccessKey: string;
}

export interface DeleteOptions {
  bucket: string;
  s3Path: string;
}

export interface S3UploadOptions {
  bucket: string;
  filePath: string;
  s3Path: string;
}

export interface S3CopyOptions {
  bucket: string;
  s3FromPath: string;
  s3ToPath: string;
}

export class S3Deployer {
  private readonly options: Required<S3DeployerOptions>;
  private readonly S3Instance: S3;
  private readonly logger: Logger;

  constructor(options: S3DeployerOptions) {
    this.options = {
      dryRun: false,
      ...options,
    };
    this.S3Instance = new S3({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    });
    const toolName = path.basename(__filename).replace(/\.[jt]s$/, '');
    this.logger = getLogger('deploy-tools', toolName);
  }

  async findUploadFiles(platform: string, basePath: string, version: string): Promise<FindResult[]> {
    if (platform.includes('linux')) {
      const appImage = await find('*.AppImage', {cwd: basePath});
      const debImage = await find('*.deb', {cwd: basePath});
      const repositoryFiles = [
        `debian/pool/main/${debImage.fileName}`,
        'debian/dists/stable/Contents-amd64',
        'debian/dists/stable/Contents-amd64.bz2',
        'debian/dists/stable/Contents-amd64.gz',
        'debian/dists/stable/InRelease',
        'debian/dists/stable/Release',
        'debian/dists/stable/Release.gpg',
        'debian/dists/stable/main/binary-amd64/Packages',
        'debian/dists/stable/main/binary-amd64/Packages.bz2',
        'debian/dists/stable/main/binary-amd64/Packages.gz',
      ].map(fileName => ({fileName, filePath: path.join(basePath, fileName)}));

      return [
        ...repositoryFiles,
        {
          fileName: appImage.fileName,
          filePath: path.join(basePath, appImage.fileName),
        },
        {
          fileName: debImage.fileName,
          filePath: path.join(basePath, debImage.fileName),
        },
      ];
    } else if (platform.includes('windows')) {
      const setupExe = await find('*-Setup.exe', {cwd: basePath});
      const nupkgFile = await find('*-full.nupkg', {cwd: basePath});
      const releasesFile = await find('RELEASES', {cwd: basePath});

      const [, appShortName] = new RegExp('(.+)-[\\d.]+-full\\.nupkg').exec(nupkgFile.fileName) || ['', ''];

      if (!appShortName) {
        throw new Error('App short name not found');
      }

      const setupExeRenamed = {...setupExe, fileName: `${appShortName}-${version}.exe`};
      const releasesRenamed = {...releasesFile, fileName: `${appShortName}-${version}-RELEASES`};

      return [
        {
          fileName: nupkgFile.fileName,
          filePath: path.join(basePath, nupkgFile.fileName),
        },
        {
          fileName: releasesRenamed.fileName,
          filePath: path.join(basePath, releasesFile.fileName),
        },
        {
          fileName: setupExeRenamed.fileName,
          filePath: path.join(basePath, setupExe.fileName),
        },
      ];
    } else if (platform.includes('macos')) {
      const setupPkg = await find('*.pkg', {cwd: basePath});
      return [setupPkg];
    }
    throw new Error(`Invalid platform "${platform}"`);
  }

  async uploadToS3(uploadOptions: S3UploadOptions): Promise<void> {
    const {bucket, filePath, s3Path} = uploadOptions;
    this.logger.log(`Uploading "${filePath}" to "${bucket}/${s3Path}" ...`);

    const lstat = await fs.lstat(filePath);

    if (!lstat.isFile()) {
      throw new Error(`File "${filePath}" not found`);
    }

    const file = fs.createReadStream(filePath);

    const uploadConfig = {
      ACL: 'public-read',
      Body: file,
      Bucket: bucket,
      Key: s3Path,
    };

    if (this.options.dryRun) {
      logDry('uploadToS3', {ACL: uploadConfig.ACL, Bucket: uploadConfig.Bucket, Key: uploadConfig.Key});
      return;
    }

    await this.S3Instance.upload(uploadConfig).promise();

    this.logger.log(`Uploaded "${bucket}/${s3Path}".`);
  }

  async deleteFromS3(deleteOptions: DeleteOptions): Promise<void> {
    const deleteConfig = {
      Bucket: deleteOptions.bucket,
      Key: deleteOptions.s3Path,
    };

    if (this.options.dryRun) {
      logDry('deleteFromS3', deleteConfig);
      return;
    }

    await this.S3Instance.deleteObject(deleteConfig).promise();
  }

  async copyOnS3(copyOptions: S3CopyOptions): Promise<void> {
    const copyConfig = {
      ACL: 'public-read',
      Bucket: copyOptions.bucket,
      CopySource: copyOptions.s3FromPath,
      Key: copyOptions.s3ToPath,
    };

    if (this.options.dryRun) {
      logDry('copyOnS3', {
        ACL: copyConfig.ACL,
        Bucket: copyConfig.Bucket,
        CopySource: copyConfig.CopySource,
        Key: copyConfig.Key,
      });
      return;
    }

    await this.S3Instance.copyObject(copyConfig).promise();
  }
}

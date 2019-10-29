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

import commander from 'commander';
import path from 'path';

import {checkCommanderOptions, getLogger} from '../bin-utils';
import {find} from './lib/deploy-utils';
import {S3Deployer} from './lib/S3Deployer';

const toolName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('deploy-tools', toolName);

commander
  .name(toolName)
  .description('Copy releases files on S3')
  .option('-b, --bucket <bucket>', 'Specify the S3 bucket to upload to')
  .option('-d, --dry-run', 'Just log without actually uploading')
  .option('-i, --key-id <id>', 'Specify the AWS access key ID')
  .option('-k, --secret-key <id>', 'Specify the AWS secret access key ID')
  .option('-p, --path <path>', 'Specify the local path to search for files (e.g. "../../wrap")')
  .option('-s, --s3path <path>', 'Specify the base path on S3 (e.g. "apps/windows")')
  .option('-w, --wrapper-build <build>', 'Specify the wrapper build (e.g. "Linux#3.7.1234")')
  .parse(process.argv);

checkCommanderOptions(commander, logger, ['bucket', 'keyId', 'secretKey', 'wrapperBuild']);

if (!commander.wrapperBuild.includes('#')) {
  logger.error(`Invalid wrapper build id "${commander.wrapperBuild}"`);
  commander.outputHelp();
  process.exit(1);
}

(async () => {
  const [platform, version] = commander.wrapperBuild.toLowerCase().split('#');

  if (platform !== 'windows') {
    throw new Error('Copying release files on S3 is supported only for Windows');
  }

  const bucket = commander.bucket;
  const searchBasePath = commander.path || path.resolve('.');
  const s3BasePath = `${commander.s3path || ''}/`.replace('//', '/');

  const nupkgFile = await find('*-full.nupkg', {cwd: searchBasePath});
  const setupExe = await find('*-Setup.exe', {cwd: searchBasePath});
  const [, appShortName] = new RegExp('(.+)-[\\d.]+-full\\.nupkg').exec(nupkgFile.fileName) || ['', ''];
  const [, appFullName] = new RegExp('(.+)-Setup\\.exe').exec(setupExe.fileName) || ['', ''];

  if (!appShortName) {
    throw new Error('App short name not found');
  }

  if (!appFullName) {
    throw new Error('App full name not found');
  }

  const staticReleaseKey = `${s3BasePath}/RELEASES`;
  const staticExeKey = `${s3BasePath}/${appFullName}-Setup.exe`;

  const latestReleaseKey = `${s3BasePath}/${appShortName}-${version}-RELEASES`;
  const latestExeKey = `${s3BasePath}/${appShortName}-${version}.exe`;

  const {secretKey: secretAccessKey, keyId: accessKeyId} = commander;

  const s3Deployer = new S3Deployer({accessKeyId, dryRun: commander.dryRun || false, secretAccessKey});

  logger.log(`Deleting "${staticReleaseKey}" from S3 ...`);
  await s3Deployer.deleteFromS3({bucket, s3Path: staticReleaseKey});

  logger.log(`Deleting "${staticExeKey}" from S3 ...`);
  await s3Deployer.deleteFromS3({bucket, s3Path: staticExeKey});

  logger.log(`Copying "${bucket}/${latestReleaseKey}" to "${staticReleaseKey}" on S3 ...`);
  await s3Deployer.copyOnS3({
    bucket,
    s3FromPath: `${bucket}/${latestReleaseKey}`,
    s3ToPath: staticReleaseKey,
  });

  logger.log(`Copying "${bucket}/${latestExeKey}" to "${staticExeKey}" on S3 ...`);
  await s3Deployer.copyOnS3({
    bucket,
    s3FromPath: `${bucket}/${latestExeKey}`,
    s3ToPath: staticExeKey,
  });

  logger.log('Done updating releases on S3.');
})().catch(error => {
  logger.error(error);
  process.exit(1);
});

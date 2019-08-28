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
import {S3Deployer} from './lib/S3Deployer';

const toolName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('deploy-tools', toolName);

commander
  .name(toolName)
  .description('Upload files to S3')
  .option('-b, --bucket <id>', 'Specify the S3 bucket to upload to')
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
  const searchBasePath = commander.path || path.join(__dirname, '../../wrap');
  const s3BasePath = `${commander.s3path || ''}/`;
  const [platform, version] = commander.wrapperBuild.toLowerCase().split('#');
  const {bucket, secretKey: secretAccessKey, keyId: accessKeyId} = commander;

  const s3Deployer = new S3Deployer({accessKeyId, dryRun: commander.dryRun || false, secretAccessKey});

  const files = await s3Deployer.findUploadFiles(platform, searchBasePath, version);

  for (const file of files) {
    const {fileName, filePath} = file;
    const s3Path = `${s3BasePath}${fileName}`.replace('//', '/');

    logger.log(`Uploading "${fileName}" to "${bucket}/${s3Path}" ...`);
    await s3Deployer.uploadToS3({
      bucket,
      filePath,
      s3Path,
    });
  }

  logger.log('Done uploading to S3.');
})().catch(error => {
  logger.error(error);
  process.exit(1);
});

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

import {program as commander} from 'commander';
import path from 'path';

import {getLogger} from '../bin-utils';
import {find, parseSupportedDeploymentPlatform} from './lib/deploy-utils';
import {publishWindowsSquirrelRelease} from './lib/publish-windows-squirrel-release';
import {S3Deployer} from './lib/S3Deployer';

const toolName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('deploy-tools', toolName);

commander
  .name(toolName)
  .description('Copy releases files on S3')
  .requiredOption('-b, --bucket <bucket>', 'Specify the S3 bucket to upload to')
  .option('-d, --dry-run', 'Just log without actually uploading')
  .requiredOption('-i, --key-id <id>', 'Specify the AWS access key ID')
  .requiredOption('-k, --secret-key <id>', 'Specify the AWS secret access key')
  .option('-p, --path <path>', 'Specify the local path to search for files (e.g. "../../wrap")')
  .option('-s, --s3path <path>', 'Specify the base path on S3 (e.g. "apps/windows")')
  .option('--versioned-name <name>', 'Specify the S3 filename stem of the versioned Squirrel artifacts')
  .option('--setup-name <name>', 'Specify the stable Squirrel setup filename')
  .requiredOption('-w, --wrapper-build <build>', 'Specify the wrapper build (e.g. "Windows#3.7.1234")')
  .parse(process.argv);

const commanderOptions = commander.opts();

if (!commanderOptions.wrapperBuild.includes('#')) {
  logger.error(`Invalid wrapper build id "${commanderOptions.wrapperBuild}"`);
  commander.outputHelp();
  process.exit(1);
}

(async () => {
  const [wrapperPlatform, version] = commanderOptions.wrapperBuild.toLowerCase().split('#');
  const platform = parseSupportedDeploymentPlatform(wrapperPlatform);

  if (platform !== 'windows') {
    throw new Error('Copying release files on S3 is supported only for Windows');
  }

  const {bucket, secretKey: secretAccessKey, keyId: accessKeyId} = commanderOptions;
  if (accessKeyId === '' || secretAccessKey === '') {
    throw new Error('Both AWS credential options must be nonempty.');
  }
  const searchBasePath = commanderOptions.path || path.resolve('.');

  let versionedName = commanderOptions.versionedName;
  if (versionedName === undefined) {
    const nupkgFile = await find('*-full.nupkg', {cwd: searchBasePath});
    const appShortName = /(.+)-[\d.]+-full\.nupkg/.exec(nupkgFile.fileName)?.[1];
    if (appShortName === undefined) {
      throw new Error('App short name not found');
    }
    versionedName = `${appShortName}-${version}`;
  }

  const setupName = commanderOptions.setupName ?? (await find('*-Setup.exe', {cwd: searchBasePath})).fileName;
  const s3Deployer = new S3Deployer({accessKeyId, dryRun: commanderOptions.dryRun || false, secretAccessKey});

  await publishWindowsSquirrelRelease({
    bucket,
    copyOnS3: async copyOptions => {
      logger.log(`Copying "${copyOptions.s3FromPath}" to "${copyOptions.s3ToPath}" on S3 ...`);
      await s3Deployer.copyOnS3(copyOptions);
    },
    s3Prefix: commanderOptions.s3path,
    setupName,
    versionedName,
  });

  logger.log('Done updating releases on S3.');
})().catch(error => {
  logger.error(error);
  process.exit(1);
});

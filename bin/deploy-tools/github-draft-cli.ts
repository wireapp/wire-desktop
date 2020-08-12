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
import fs from 'fs-extra';
import path from 'path';

import {checkCommanderOptions, execAsync, getLogger} from '../bin-utils';
import {FileExtension} from './lib/deploy-utils';
import {GitHubDraftDeployer} from './lib/GitHubDraftDeployer';

const toolName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('deploy-tools', toolName);

commander
  .name(toolName)
  .description('Create a release draft on GitHub')
  .option('-d, --dry-run', 'Just log without actually uploading')
  .option('-p, --path <path>', 'Specify the local path to look for files (e.g. "../../wrap")')
  .option('-t, --github-token <token>', 'Specify the GitHub access token')
  .option('-w, --wrapper-build <build>', 'Specify the wrapper build (e.g. "Linux#3.7.1234")')
  .parse(process.argv);

checkCommanderOptions(commander, logger, ['githubToken', 'wrapperBuild']);

if (!commander.wrapperBuild.includes('#')) {
  logger.error(`Invalid wrapper build id "${commander.wrapperBuild}"`);
  commander.outputHelp();
  process.exit(1);
}

const repoSlug = 'wireapp/wire-desktop';

const endsWithAny = (suffixes: string[], str: string) => suffixes.some(suffix => str.endsWith(suffix));

(async () => {
  let PLATFORM: string;
  const extensions = [FileExtension.ASC, FileExtension.SIG];

  const [platform, version] = commander.wrapperBuild.toLowerCase().split('#');
  const basePath = commander.path || path.resolve('.');

  if (platform.includes('linux')) {
    PLATFORM = 'Linux';
    extensions.push(FileExtension.APPIMAGE, FileExtension.DEB);
  } else if (platform.includes('windows')) {
    PLATFORM = 'Windows';
    extensions.push(FileExtension.EXE);
  } else if (platform.includes('macos')) {
    PLATFORM = 'macOS';
    extensions.push(FileExtension.PKG);
  } else {
    throw new Error(`Invalid platform "${platform}"`);
  }

  const {stdout: commitId} = await execAsync('git rev-parse HEAD');
  const changelog = '...';
  const githubToken = commander.githubToken;

  logger.log('Creating a draft ...');

  const githubDraftDeployer = new GitHubDraftDeployer({
    dryRun: commander.dryRun || false,
    githubToken,
    repoSlug,
  });

  const {id: draftId} = await githubDraftDeployer.createDraft({
    changelog,
    commitOrBranch: commitId,
    tagName: `${PLATFORM.toLowerCase()}/${version}`,
    title: `${version} - ${PLATFORM}`,
  });

  logger.log('Draft created.');

  const files = await fs.readdir(basePath);
  const uploadFiles = files.filter(fileName => endsWithAny(extensions, fileName));

  for (const fileName of uploadFiles) {
    const resolvedPath = path.join(basePath, fileName);

    logger.log(`Uploading asset "${fileName}" ...`);
    await githubDraftDeployer.uploadAsset({draftId, fileName, filePath: resolvedPath});
    logger.log(`Asset "${fileName}" uploaded.`);
  }

  logger.log('Done creating GitHub draft.');
})().catch(error => {
  logger.error(error);
  process.exit(1);
});

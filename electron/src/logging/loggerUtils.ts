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
 *
 */

import {app} from 'electron';
import * as fs from 'fs-extra';
import * as globby from 'globby';
import * as JSZip from 'jszip';
import * as os from 'os';
import * as path from 'path';

const logDir = path.join(app.getPath('userData'), 'logs');

function createTempDir(): Promise<string> {
  const prefix = path.join(os.tmpdir(), 'wire-desktop-');
  return fs.mkdtemp(prefix);
}

async function createZip(files: string[]): Promise<string> {
  const tempDir = await createTempDir();
  const filePath = path.join(tempDir, 'logs.zip');
  const jszip = new JSZip();

  for (const filePath of files) {
    const resolvedPath = path.join(logDir, filePath);
    const fileStat = await fs.lstat(resolvedPath);
    const fileData = await fs.readFile(resolvedPath);
    jszip.file(filePath, fileData, {
      createFolders: true,
      date: fileStat.mtime,
      unixPermissions: fileStat.mode,
    });
  }

  const data = await jszip.generateAsync({
    compression: 'DEFLATE',
    compressionOptions: {
      level: 5,
    },
    type: 'nodebuffer',
  });

  await fs.writeFile(filePath, data);
  return filePath;
}

export async function zipLogs(): Promise<string> {
  const files = await globby('**/*', {cwd: logDir, followSymbolicLinks: false});
  return createZip(files);
}

export async function gatherLogs(): Promise<string> {
  const files = await globby('**/*', {cwd: logDir, followSymbolicLinks: false});
  if (!files.length) {
    return 'No log files found.';
  }
  let log = '';
  for (const filePath of files) {
    const resolvedPath = path.join(logDir, filePath);
    log += `\n\n+++++++ ${filePath} +++++++\n`;
    log += await fs.readFile(resolvedPath);
    log += '++++++++++++++++++++++++++++\n';
  }
  return log;
}

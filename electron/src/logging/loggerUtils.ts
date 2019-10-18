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
import * as path from 'path';

const logDir = path.join(app.getPath('userData'), 'logs');

export async function gatherLogs(): Promise<string> {
  let log = '';

  const relativeFilePaths = await globby('**/*', {cwd: logDir, followSymbolicLinks: false});

  for (const relativeFilePath of relativeFilePaths) {
    const resolvedPath = path.join(logDir, relativeFilePath);
    log += `\n\n+++++++ ${relativeFilePath} +++++++\n`;
    try {
      log += await fs.readFile(resolvedPath, 'utf-8');
    } catch (error) {
      log += 'File not readable.';
    }
    log += '++++++++++++++++++++++++++++\n';
  }

  return log || 'No log files found.';
}

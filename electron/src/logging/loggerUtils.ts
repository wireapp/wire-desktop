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

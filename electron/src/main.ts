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

import {app} from 'electron';

import * as path from 'path';

import {protectLogDirectoryAtStartup} from './logging/logPermissions';
import {configurePortableUserDataAtStartup} from './runtime/configurePortableUserData';

configurePortableUserDataAtStartup();
try {
  protectLogDirectoryAtStartup(path.join(app.getPath('userData'), 'logs'));
} catch (error) {
  const failureCode = error instanceof Error && 'code' in error ? String(error.code) : 'unknown';
  process.stderr.write(
    `Unable to protect existing Desktop logs (error ${failureCode}); writes and exports will fail closed where unsafe.\n`,
  );
}

function loadMainProcess(): void {
  require('./mainProcess');
}

loadMainProcess();

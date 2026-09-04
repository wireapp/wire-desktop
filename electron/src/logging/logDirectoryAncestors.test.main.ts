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

import * as assert from 'assert';
import * as path from 'path';

import {getLogDirectoryAncestors} from './logDirectoryAncestors';

describe('desktop log directory ancestors', () => {
  it('returns nested ancestors deepest-first without the log root', () => {
    const actualAncestors = getLogDirectoryAncestors({
      logDirectory: path.join('logs'),
      pathToRemove: path.join('logs', '2026-08-20', 'accounts', 'account', 'console.log'),
      pathType: 'file',
    });
    const expectedAncestors = [
      path.join('logs', '2026-08-20', 'accounts', 'account'),
      path.join('logs', '2026-08-20', 'accounts'),
      path.join('logs', '2026-08-20'),
    ];

    assert.deepStrictEqual(actualAncestors, expectedAncestors);
  });

  it('returns no ancestors for the root or a path outside the root', () => {
    const actualRootAncestors = getLogDirectoryAncestors({
      logDirectory: path.join('logs'),
      pathToRemove: path.join('logs'),
      pathType: 'directory',
    });
    const actualOutsideAncestors = getLogDirectoryAncestors({
      logDirectory: path.join('logs'),
      pathToRemove: path.join('other', 'account', 'console.log'),
      pathType: 'file',
    });

    assert.deepStrictEqual(actualRootAncestors, []);
    assert.deepStrictEqual(actualOutsideAncestors, []);
  });
});

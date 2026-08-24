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

import {Maybe} from 'true-myth';

import * as assert from 'assert';
import * as path from 'path';

import {configurePortableUserData} from './configurePortableUserData';
import {resolvePortableUserDataPath} from './portableUserData';

describe('portable user-data path', () => {
  it('resolves a custom user-data directory to an absolute path', () => {
    const actualPath = resolvePortableUserDataPath({
      executablePath: '/Applications/Wire.app/Contents/MacOS/Wire',
      portableModeEnabled: false,
      userDataDirectoryArgument: Maybe.just('custom-user-data'),
      appImagePath: Maybe.nothing<string>(),
    });
    const expectedPath = path.resolve('custom-user-data');

    assert.strictEqual(actualPath.unwrapOr(''), expectedPath);
  });

  it('resolves portable mode below the AppImage path', () => {
    const actualPath = resolvePortableUserDataPath({
      executablePath: '/opt/Wire/Wire',
      portableModeEnabled: true,
      userDataDirectoryArgument: Maybe.nothing<string>(),
      appImagePath: Maybe.just('/opt/Wire/Wire.AppImage'),
    });
    const expectedPath = path.join('/opt/Wire/Wire.AppImage', '../Data');

    assert.strictEqual(actualPath.unwrapOr(''), expectedPath);
  });

  it('returns Nothing when no portable or custom path is configured', () => {
    const actualPath = resolvePortableUserDataPath({
      executablePath: '/opt/Wire/Wire',
      portableModeEnabled: false,
      userDataDirectoryArgument: Maybe.nothing<string>(),
      appImagePath: Maybe.nothing<string>(),
    });

    assert.strictEqual(actualPath.isNothing, true);
  });

  it('configures the resolved user-data path through the injected boundary', () => {
    const configuredUserDataPaths: string[] = [];
    const expectedPath = path.resolve('custom-user-data');
    const actualPath = configurePortableUserData({
      portableUserDataPathParameters: {
        executablePath: '/Applications/Wire.app/Contents/MacOS/Wire',
        portableModeEnabled: false,
        userDataDirectoryArgument: Maybe.just('custom-user-data'),
        appImagePath: Maybe.nothing<string>(),
      },
      setUserDataPath: userDataPath => configuredUserDataPaths.push(userDataPath),
    });

    assert.strictEqual(actualPath.unwrapOr(''), expectedPath);
    assert.deepStrictEqual(configuredUserDataPaths, [expectedPath]);
  });
});

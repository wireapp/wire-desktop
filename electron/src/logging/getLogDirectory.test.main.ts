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
 */

import * as assert from 'assert';
import {app} from 'electron';
import * as path from 'path';

import {getLogDirectory} from './getLogDirectory';

describe('getLogDirectory', () => {
  it('resolves the current Electron user data directory when called', () => {
    const originalUserDataDirectory = app.getPath('userData');
    const firstUserDataDirectory = path.join(originalUserDataDirectory, 'first-log-directory-test');
    const secondUserDataDirectory = path.join(originalUserDataDirectory, 'second-log-directory-test');

    try {
      app.setPath('userData', firstUserDataDirectory);
      const firstActualLogDirectory = getLogDirectory();
      const firstExpectedLogDirectory = path.join(firstUserDataDirectory, 'logs');

      app.setPath('userData', secondUserDataDirectory);
      const secondActualLogDirectory = getLogDirectory();
      const secondExpectedLogDirectory = path.join(secondUserDataDirectory, 'logs');

      assert.strictEqual(firstActualLogDirectory, firstExpectedLogDirectory);
      assert.strictEqual(secondActualLogDirectory, secondExpectedLogDirectory);
    } finally {
      app.setPath('userData', originalUserDataDirectory);
    }
  });
});

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

import {activatePrimaryWindow} from './activatePrimaryWindow';

const createWindow = (isMinimized: boolean) => {
  const calls: string[] = [];

  return {
    calls,
    window: {
      isMinimized: () => isMinimized,
      restore: () => calls.push('restore'),
      show: () => calls.push('show'),
      focus: () => calls.push('focus'),
    },
    application: {
      focus: () => calls.push('app.focus'),
    },
  };
};

describe('activatePrimaryWindow', () => {
  it('shows a visible window and activates the app on macOS', () => {
    const {calls, window, application} = createWindow(false);

    activatePrimaryWindow(window, application, 'darwin');

    assert.deepStrictEqual(calls, ['show', 'focus', 'app.focus']);
  });

  it('shows a visible window without activating the app on other platforms', () => {
    const {calls, window, application} = createWindow(false);

    activatePrimaryWindow(window, application, 'win32');

    assert.deepStrictEqual(calls, ['show', 'focus']);
  });

  it('restores a minimized window before showing it', () => {
    const {calls, window, application} = createWindow(true);

    activatePrimaryWindow(window, application, 'linux');

    assert.deepStrictEqual(calls, ['restore', 'show', 'focus']);
  });
});

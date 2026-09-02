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

import {initializeFirstInstance} from './applicationBootstrap';

describe('first-instance application bootstrap', () => {
  it('initializes Electron handlers before app events and log maintenance', () => {
    const events: string[] = [];

    initializeFirstInstance({
      bindIpcEvents() {
        events.push('bind-ipc-events');
      },
      ensureMainProcessLogFile() {
        events.push('ensure-main-process-log-file');
      },
      handleAppEvents() {
        events.push('handle-app-events');
      },
      initializeElectronWrapper() {
        events.push('initialize-electron-wrapper');
      },
      startDesktopLogLifecycle() {
        events.push('start-desktop-log-lifecycle');
      },
    });

    const actualCriticalEvents = events.filter(event =>
      ['initialize-electron-wrapper', 'handle-app-events', 'start-desktop-log-lifecycle'].includes(event),
    );
    const expectedCriticalEvents = ['initialize-electron-wrapper', 'handle-app-events', 'start-desktop-log-lifecycle'];

    assert.deepStrictEqual(actualCriticalEvents, expectedCriticalEvents);
  });
});

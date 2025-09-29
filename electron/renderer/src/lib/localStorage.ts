/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import {createSandboxLogger} from '../../../src/shared/contextIsolationConstants';
import {State} from '../index';

const STATE_NAME = 'state';

/**
 * Logger for localStorage operations
 *
 * Context Isolation Security: Uses shared sandbox logger instead of main process getLogger
 * which is not available in the sandboxed renderer process due to context isolation.
 */
const logger = createSandboxLogger('localStorage');

export const loadState = (): State | undefined => {
  try {
    const serializedState = localStorage.getItem(STATE_NAME);
    return !!serializedState ? (JSON.parse(serializedState) as State) : undefined;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('ERROR: Failed to load state ', error.message);
    }
    return undefined;
  }
};

export const saveState = (state: State) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STATE_NAME, serializedState);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('ERROR: Failed to save state ', error.message);
    }
  }
};

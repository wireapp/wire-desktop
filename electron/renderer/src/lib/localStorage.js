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

const STATE_NAME = 'state';

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem(STATE_NAME);
    return !!serializedState ? JSON.parse(serializedState) : undefined;
  } catch (error) {
    console.error('ERROR: Failed to load state ', error.message);
    return undefined;
  }
};

export const saveState = state => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STATE_NAME, serializedState);
  } catch (error) {
    console.error('ERROR: Failed to save state ', error.message);
  }
};

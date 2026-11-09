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

import {createAccount} from '../../reducers/accountReducer';
import {initialState as initialContextMenuState} from '../../reducers/contextMenuReducer';
import {loadState, saveState} from '../localStorage';

describe('localStorage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should return saved state', () => {
    const state = {
      accounts: [createAccount()],
      contextMenuState: initialContextMenuState,
    };

    saveState(state);

    expect(loadState()).toEqual(state);
  });

  it('restores an empty account WebApp URL without migrating it', () => {
    const account = {...createAccount(), webappUrl: ''};
    const state = {
      accounts: [account],
      contextMenuState: initialContextMenuState,
    };

    saveState(state);

    expect(loadState()).toEqual(state);
  });

  it('preserves a legacy queued conversation without adding a kind', () => {
    const link = {key: 'key', code: 'code', domain: null};
    const account = {...createAccount(), conversationJoinData: link};
    localStorage.setItem('state', JSON.stringify({accounts: [account], contextMenuState: initialContextMenuState}));

    expect(loadState()).toEqual({
      accounts: [account],
      contextMenuState: initialContextMenuState,
    });
  });

  it.each([
    {kind: 'conversation' as const, key: 'key', code: 'code'},
    {kind: 'meeting' as const, key: 'key', code: 'code', domain: 'example.com'},
  ])('preserves an explicit $kind discriminator when loading saved state', conversationJoinData => {
    const state = {
      accounts: [{...createAccount(), conversationJoinData}],
      contextMenuState: initialContextMenuState,
    };
    saveState(state);

    expect(loadState()).toEqual(state);
  });
});

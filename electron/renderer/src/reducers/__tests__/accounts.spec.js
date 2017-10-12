/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

import reducer from '../accounts';
import {updateAccount, addAccount, switchAccount, updateAccountBadge, deleteAccount} from '../../actions';

describe('accounts reducer', () => {
  it('should return the initial state with one account', () => {
    expect(reducer(undefined, {}).length).toEqual(1);
  });

  it('should return a state with a new account', () => {
    const state = [
      {
        accentID: undefined,
        badgeCount: 0,
        id: '046da4f1-39be-4b8b-823b-e71f12811454',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: true,
      },
    ];
    const newState = reducer(state, addAccount());

    expect(newState.length).toEqual(2);
    expect(newState[0].visible).toBeFalsy();
    expect(newState[1].visible).toBeTruthy();
    expect(newState[1].sessionID).toBeDefined();
  });

  it('should return a state with a new account without a session', () => {
    const state = [
      {
        accentID: undefined,
        badgeCount: 0,
        id: '046da4f1-39be-4b8b-823b-e71f12811454',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: true,
      },
    ];
    const newState = reducer(state, addAccount(false));

    expect(newState.length).toEqual(2);
    expect(newState[0].visible).toBeFalsy();
    expect(newState[1].visible).toBeTruthy();
    expect(newState[1].sessionID).not.toBeDefined();
  });

  it('should return a state with only the specified account visible', () => {
    const state = [
      {
        accentID: undefined,
        badgeCount: 0,
        id: '046da4f1-39be-4b8b-823b-e71f12811454',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: true,
      },
      {
        accentID: undefined,
        badgeCount: 0,
        id: 'd01eb964-bf56-4668-8883-dc248b58b1ca',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: false,
      },
    ];
    const newState = reducer(state, switchAccount(state[1].id));

    expect(newState[0].visible).toBeFalsy();
    expect(newState[1].visible).toBeTruthy();
  });

  it('should return a state with an updated account', () => {
    const state = [
      {
        accentID: undefined,
        badgeCount: 0,
        id: '046da4f1-39be-4b8b-823b-e71f12811454',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: true,
      },
      {
        accentID: undefined,
        badgeCount: 0,
        id: 'd01eb964-bf56-4668-8883-dc248b58b1ca',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: false,
      },
    ];
    const newState = reducer(state, updateAccount(state[0].id, {userID: 'f4b9a5d0-3e36-4e6f-a404-ba22d23e3730'}));

    expect(newState[0].userID).toEqual('f4b9a5d0-3e36-4e6f-a404-ba22d23e3730');
    expect(newState[1].userID).toBeUndefined();
  });

  it('should return a state with an updated badge count', () => {
    const state = [
      {
        accentID: undefined,
        badgeCount: 0,
        id: '046da4f1-39be-4b8b-823b-e71f12811454',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: true,
      },
      {
        accentID: undefined,
        badgeCount: 0,
        id: 'd01eb964-bf56-4668-8883-dc248b58b1ca',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: false,
      },
    ];
    const newState = reducer(state, updateAccountBadge(state[1].id, 12));

    expect(newState[0].badgeCount).toEqual(0);
    expect(newState[1].badgeCount).toEqual(12);
  });

  it('should return a state without the deleted account', () => {
    const state = [
      {
        accentID: undefined,
        badgeCount: 0,
        id: '046da4f1-39be-4b8b-823b-e71f12811454',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: true,
      },
      {
        accentID: undefined,
        badgeCount: 0,
        id: 'd01eb964-bf56-4668-8883-dc248b58b1ca',
        name: undefined,
        picture: undefined,
        sessionID: undefined,
        teamID: undefined,
        userID: undefined,
        visible: false,
      },
    ];
    const newState = reducer(state, deleteAccount(state[0].id));

    expect(newState.length).toEqual(1);
    expect(newState[0].id).toEqual('d01eb964-bf56-4668-8883-dc248b58b1ca');
  });
});

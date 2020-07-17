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

/* eslint-disable no-magic-numbers */

import {addAccount, deleteAccount, updateAccount, updateAccountBadge} from '../../actions';
import accountReducer from '../accountReducer';
import {switchAccount} from '../../actions/AccountAction';

describe('accounts reducer', () => {
  it('should return the initial state with one account', () => {
    expect(accountReducer(undefined, {}).length).toEqual(1);
  });

  it('should return a state with a new account', () => {
    const initialState = [
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
    const newState = accountReducer(initialState, addAccount());
    const [firstAccount, secondAccount] = newState;

    expect(newState.length).toEqual(2);
    expect(firstAccount.visible).toBeFalsy();
    expect(secondAccount.visible).toBeTruthy();
    expect(secondAccount.sessionID).toBeDefined();
  });

  it('should return a state with a new account without a session', () => {
    const initialState = [
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
    const newState = accountReducer(initialState, addAccount(false));
    const [firstAccount, secondAccount] = newState;

    expect(newState.length).toEqual(2);
    expect(firstAccount.visible).toBeFalsy();
    expect(secondAccount.visible).toBeTruthy();
    expect(secondAccount.sessionID).not.toBeDefined();
  });

  it('should return a state with only the specified account visible', () => {
    const initialState = [
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
    const [firstAccount, secondAccount] = accountReducer(initialState, switchAccount(initialState[1].id));

    expect(firstAccount.visible).toBeFalsy();
    expect(secondAccount.visible).toBeTruthy();
  });

  it('should return a state with an updated account', () => {
    const initialState = [
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
    const accountData = {userID: 'f4b9a5d0-3e36-4e6f-a404-ba22d23e3730'};
    const [firstAccount, secondAccount] = accountReducer(initialState, updateAccount(initialState[0].id, accountData));

    expect(firstAccount.userID).toEqual('f4b9a5d0-3e36-4e6f-a404-ba22d23e3730');
    expect(secondAccount.userID).toBeUndefined();
  });

  it('should return a state with an updated badge count', () => {
    const initialState = [
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
    const [firstAccount, secondAccount] = accountReducer(initialState, updateAccountBadge(initialState[1].id, 12));

    expect(firstAccount.badgeCount).toEqual(0);
    expect(secondAccount.badgeCount).toEqual(12);
  });

  it('should return a state without the deleted account', () => {
    const initialState = [
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
    const newState = accountReducer(initialState, deleteAccount(initialState[0].id));
    const [firstAccount] = newState;

    expect(newState.length).toEqual(1);
    expect(firstAccount.id).toEqual('d01eb964-bf56-4668-8883-dc248b58b1ca');
  });
});

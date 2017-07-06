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

import uuid from 'uuid/v4';

import {
  ADD_ACCOUNT,
  SWITCH_ACCOUNT,
  UPDATE_ACCOUNT,
  UPDATE_ACCOUNT_BADGE,
  DELETE_ACCOUNT,
  addAccountWithSession,
  updateAccount,
  addAccount,
  switchAccount,
  updateAccountBadge,
  deleteAccount,
} from '../';

describe('action creators', () => {

  describe('addAccountWithSession', () => {
    it('should create action to add account with session', () => {
      const action = addAccountWithSession();
      expect(action.type).toEqual(ADD_ACCOUNT);
      expect(action.sessionID).toEqual(expect.any(String));
    });
  });

  describe('updateAccount', () => {
    it('should create action to update account', () => {
      const id = uuid();
      const data = { name: 'Foo' };
      const action = {
        type: UPDATE_ACCOUNT,
        id,
        data,
      };
      expect(updateAccount(id, data)).toEqual(action);
    });
  });

  describe('addAccount', () => {
    it('should create action to add an account', () => {
      const action = {
        type: ADD_ACCOUNT,
      };
      expect(addAccount()).toEqual(action);
    });
  });

  describe('switchAccount', () => {
    it('should create action to switch account', () => {
      const id = uuid();
      const action = {
        type: SWITCH_ACCOUNT,
        id,
      };
      expect(switchAccount(id)).toEqual(action);
    });
  });

  describe('updateAccountBadge', () => {
    it('should create action to update account badge', () => {
      const id = uuid();
      const count = 42;
      const action = {
        type: UPDATE_ACCOUNT_BADGE,
        id,
        count,
      };
      expect(updateAccountBadge(id, count)).toEqual(action);
    });
  });

  describe('deleteAccount', () => {
    it('should create action to delete an account', () => {
      const id = uuid();
      const action = {
        type: DELETE_ACCOUNT,
        id,
      };
      expect(deleteAccount(id)).toEqual(action);
    });
  });

});

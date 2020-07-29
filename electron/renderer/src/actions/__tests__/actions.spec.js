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

import {generateUUID} from '../../lib/util';
import {ActionType, addAccount, deleteAccount, updateAccount, updateAccountBadge} from '../';
import {switchAccount} from '../AccountAction';

describe('action creators', () => {
  describe('addAccount', () => {
    it('should create action to add account with session', () => {
      const action = addAccount();
      expect(action.type).toEqual(ActionType.ADD_ACCOUNT);
      expect(action.sessionID).toEqual(expect.any(String));
    });
  });

  describe('updateAccount', () => {
    it('should create action to update account', () => {
      const id = generateUUID();
      const data = {name: 'Foo'};
      const action = {
        data,
        id,
        type: ActionType.UPDATE_ACCOUNT,
      };
      expect(updateAccount(id, data)).toEqual(action);
    });
  });

  describe('switchAccount', () => {
    it('should create action to switch account', () => {
      const id = generateUUID();
      const action = {
        id,
        type: ActionType.SWITCH_ACCOUNT,
      };
      expect(switchAccount(id)).toEqual(action);
    });
  });

  describe('updateAccountBadge', () => {
    it('should create action to update account badge', () => {
      const id = generateUUID();
      const count = 42;
      const action = {
        count,
        id,
        type: ActionType.UPDATE_ACCOUNT_BADGE,
      };
      expect(updateAccountBadge(id, count)).toEqual(action);
    });
  });

  describe('deleteAccount', () => {
    it('should create action to delete an account', () => {
      const id = generateUUID();
      const action = {
        id,
        type: ActionType.DELETE_ACCOUNT,
      };
      expect(deleteAccount(id)).toEqual(action);
    });
  });
});

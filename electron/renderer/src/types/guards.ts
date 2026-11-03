/*
 * Wire
 * Copyright (C) 2023 Wire Swiss GmbH
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

import {Account, ConversationJoinData} from './account';

export const isString = (value: any): value is string => typeof value === 'string';

export const isNumber = (value: any): value is number => typeof value === 'number';

export const isBoolean = (value: any): value is boolean => typeof value === 'boolean';

export const isAccount = (value: any): value is Account => value.hasOwnProperty('userID');

export const isConversationJoinData = (value: any): value is ConversationJoinData => {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const {code, key, kind, domain, password} = value;
  if (!isString(code) || !isString(key)) {
    return false;
  }

  switch (kind) {
    case 'meeting':
      return isString(domain) && domain.length > 0 && (password === undefined || isString(password));
    case 'conversation':
    case undefined:
      return (domain === undefined || domain === null || isString(domain)) && password === undefined;
    default:
      return false;
  }
};

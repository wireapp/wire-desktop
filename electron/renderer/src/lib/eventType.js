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

export const ACCOUNT = {
  CREATE_WITH_CUSTOM_BACKEND: 'EVENT_TYPE.ACCOUNT.CREATE_WITH_CUSTOM_BACKEND',
  UPDATE_INFO: 'EVENT_TYPE.ACCOUNT.UPDATE_INFO',
};

export const ACTION = {
  CREATE_SSO_ACCOUNT: 'EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT',
  CREATE_SSO_ACCOUNT_RESPONSE: 'EVENT_TYPE.ACTION.CREATE_SSO_ACCOUNT_RESPONSE',
  NOTIFICATION_CLICK: 'EVENT_TYPE.ACTION.NOTIFICATION_CLICK',
  SWITCH_ACCOUNT: 'EVENT_TYPE.ACTION.SWITCH_ACCOUNT',
};

export const CUSTOM_BACKEND = {
  GET_OPTIONS_RESPONSE: 'EVENT_TYPE.CUSTOM_BACKEND.GET_OPTIONS_RESPONSE',
  GET_URL: 'EVENT_TYPE.CUSTOM_BACKEND.GET_URL',
};

export const LIFECYCLE = {
  SIGNED_IN: 'EVENT_TYPE.LIFECYCLE.SIGNED_IN',
  SIGNED_OUT: 'EVENT_TYPE.LIFECYCLE.SIGNED_OUT',
  SIGN_OUT: 'EVENT_TYPE.LIFECYCLE.SIGN_OUT',
  UNREAD_COUNT: 'EVENT_TYPE.LIFECYCLE.UNREAD_COUNT',
};

export const PREFERENCES = {
  SET_HIDDEN: 'EVENT_TYPE.PREFERENCES.SET_HIDDEN',
};

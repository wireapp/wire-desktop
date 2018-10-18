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

/** Enum of different webapp events. */
interface z {
  event: {
    WebApp: {
      CALL: {
        STATE: {
          TOGGLE: string;
        };
      };
      CONVERSATION: {
        SHOW: string;
      };
      LIFECYCLE: {
        ASK_TO_CLEAR_DATA: string;
        LOADED: string;
        RESTART: string;
        SIGN_OUT: string;
        SIGNED_OUT: string;
        UNREAD_COUNT: string;
        UPDATE: string;
      };
      NOTIFICATION: {
        CLICK: string;
      };
      PREFERENCES: {
        MANAGE_ACCOUNT: string;
      };
      SHORTCUT: {
        ADD_PEOPLE: string;
        ARCHIVE: string;
        CALL_MUTE: string;
        CALL_REJECT: string;
        DELETE: string;
        NEXT: string;
        NOTIFICATIONS: string;
        PEOPLE: string;
        PICTURE: string;
        PING: string;
        PREV: string;
        START: string;
      };
      TEAM: {
        INFO: string;
      };
    };
  };
  // taken from https://github.com/wireapp/wire-webapp/blob/staging/app/script/lifecycle/UpdateSource.js
  lifecycle: {
    UPDATE_SOURCE: {
      DESKTOP: string;
    };
  };
  util: {
    Environment: {
      version(showWrapperVersion?: boolean, doNotFormat?: boolean): string;
    };
  };
}

interface wire {
  app: any;
}
export {wire, z};

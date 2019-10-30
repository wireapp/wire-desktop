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

import {Data as OpenGraphResult} from 'open-graph';

import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import {i18nStrings} from './locale';
import {Schemata} from './main';

declare global {
  interface Window {
    amplify: {
      publish(topic: string, ...args: any[]): boolean;
      subscribe(topic: string, callback: Function, priority?: number): void;
    };
    isMac: boolean;
    locStrings: i18nStrings;
    locStringsDefault: i18nStrings;
    sendBadgeCount(count: number): void;
    sendDeleteAccount(accountId: string, sessionId?: string): Promise<void>;
    sendLogoutAccount(accountId: string): void;
    wire: any;
    z: {
      event: {
        WebApp: {
          CALL: {
            STATE: {
              TOGGLE: string;
            };
          };
          LIFECYCLE: {
            ASK_TO_CLEAR_DATA: string;
            LOADED: string;
            REFRESH: string;
            RESTART: string;
            SIGNED_OUT: string;
            SIGN_OUT: string;
            UNREAD_COUNT: string;
            UPDATE: string;
          };
          NOTIFICATION: {
            CLICK: string;
          };
          PREFERENCES: {
            MANAGE_ACCOUNT: string;
          };
          PROPERTIES: {
            UPDATE: {
              INTERFACE: {
                USE_DARK_MODE: string;
              };
            };
          };
          SHORTCUT: {
            ADD_PEOPLE: string;
            ARCHIVE: string;
            DELETE: string;
            NEXT: string;
            NOTIFICATIONS: string;
            PEOPLE: string;
            PICTURE: string;
            PING: string;
            PREV: string;
            SILENCE: string;
            START: string;
          };
          TEAM: {
            EVENT_FROM_BACKEND: string;
            INFO: string;
            MEMBER_LEAVE: string;
            UPDATE_INFO: string;
          };
        };
      };
      lifecycle: {
        UPDATE_SOURCE: {
          DESKTOP: string;
        };
      };
      util: {
        Environment: {
          version(showWrapperVersion: boolean): string;
        };
      };
    };
  }

  namespace NodeJS {
    interface Global {
      environment: typeof EnvironmentUtil;
      openGraphAsync(url: string): Promise<OpenGraphResult>;
      _ConfigurationPersistence: Schemata;
    }
  }
}

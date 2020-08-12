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

import type {DesktopCapturer} from 'electron';
import type {WebAppEvents} from '@wireapp/webapp-events';
import type {Data as OpenGraphResult} from 'open-graph';

import type * as EnvironmentUtil from './runtime/EnvironmentUtil';
import type {i18nStrings} from './locale/locale';

declare global {
  interface Window {
    amplify: {
      publish(topic: string, ...args: any[]): boolean;
      subscribe(topic: string, callback: Function, priority?: number): void;
    };
    isMac: boolean;
    locStrings: i18nStrings;
    locStringsDefault: i18nStrings;
    sendBadgeCount(count: number, ignoreFlash: boolean): void;
    sendDeleteAccount(accountId: string, sessionId?: string): Promise<void>;
    sendLogoutAccount(accountId: string): Promise<void>;
    wire: any;
    z: {
      event: {
        WebApp: typeof WebAppEvents;
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
      _ConfigurationPersistence: Record<string, any>;
      desktopCapturer: DesktopCapturer;
      environment: typeof EnvironmentUtil;
      openGraphAsync(url: string): Promise<OpenGraphResult>;
    }
  }
}

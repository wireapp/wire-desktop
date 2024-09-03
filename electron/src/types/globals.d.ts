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

import type {Static as amplify} from 'amplify';
import type {Data as OpenGraphResult} from 'open-graph';

import type {WebAppEvents} from '@wireapp/webapp-events';

import type {i18nStrings, SupportedI18nLanguage} from '../locale';
import type * as EnvironmentUtil from '../runtime/EnvironmentUtil';

export declare global {
  /* eslint-disable no-var */
  var _ConfigurationPersistence: Record<string, any>;
  var desktopCapturer: {
    getDesktopSources(options: Electron.SourcesOptions): Promise<Electron.DesktopCapturerSource[]>;
  };
  var systemCrypto: {
    decrypt: (payload: Uint8Array) => Promise<string>;
    encrypt: (value: string) => Promise<Uint8Array>;
    /**
     * version:
     *   - undefined: the encrypt/decrypt methods would take and return Uint8Array (and try to parse them as base64)
     *   - 1: the encrypt/decrypt methods would take and return string (no assumption on the format (base64, hex, etc.)))
     */
    version: number;
  };
  var environment: typeof EnvironmentUtil;
  var openGraphAsync: (url: string) => Promise<OpenGraphResult>;
  var desktopAppConfig: {
    version: string;
    supportsCallingPopoutWindow?: boolean;
  };
  /* eslint-enable no-var */

  interface Window {
    amplify: amplify;
    isMac: boolean;
    locale: SupportedI18nLanguage;
    locStrings: i18nStrings;
    locStringsDefault: i18nStrings;
    sendBadgeCount(count: number, ignoreFlash: boolean): void;
    sendConversationJoinToHost(accountId: string, code: string, key: string, domain?: string): void;
    sendDeleteAccount(accountId: string, sessionID?: string): Promise<void>;
    sendLogoutAccount(accountId: string): Promise<void>;
    submitDeepLink(url: string): void;
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
          avsVersion?: () => string;
        };
      };
    };
  }

  namespace NodeJS {
    interface Global {
      _ConfigurationPersistence: Record<string, any>;
      desktopCapturer: {
        getDesktopSources(options: Electron.SourcesOptions): Promise<Electron.DesktopCapturerSource[]>;
      };
      environment: typeof EnvironmentUtil;
      openGraphAsync(url: string): Promise<OpenGraphResult>;
      systemCrypto?: {
        decrypt: (payload: Uint8Array) => Promise<string>;
        encrypt: (value: string) => Promise<Uint8Array>;
        /**
         * version:
         *   - undefined: the encrypt/decrypt methods would take and return Uint8Array (and try to parse them as base64)
         *   - 1: the encrypt/decrypt methods would take and return string (no assumption on the format (base64, hex, etc.)))
         */
        version: number;
      };
    }
  }
}

/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import {Account} from '../types/account';

export type EnvironmentUrlAccount = Pick<Account, 'id' | 'isAdding' | 'ssoCode' | 'webappUrl'>;

export type ResolveEnvironmentUrlParameters = {
  account: EnvironmentUrlAccount;
  currentLocation: string;
  locale: string;
};

export type ResolveInitialWebviewUrlParameters = ResolveEnvironmentUrlParameters & {
  noUrlConfigured: boolean;
};

export function resolveInitialWebviewUrl(parameters: ResolveInitialWebviewUrlParameters): string {
  if (parameters.noUrlConfigured) {
    return '';
  }

  return resolveEnvironmentUrl(parameters);
}

export function resolveEnvironmentUrl(parameters: ResolveEnvironmentUrlParameters): string {
  const currentLocation = new URL(parameters.currentLocation);
  const accountSpecificUrl = parameters.account.webappUrl;
  const hasAccountSpecificUrl = typeof accountSpecificUrl === 'string' && accountSpecificUrl.length > 0;
  const environmentUrlParameter = hasAccountSpecificUrl ? accountSpecificUrl : currentLocation.searchParams.get('env');

  if (typeof environmentUrlParameter !== 'string' || environmentUrlParameter.length === 0) {
    if (hasAccountSpecificUrl) {
      throw new Error('The account WebApp URL is invalid');
    }

    throw new Error('The configured WebApp environment URL is missing');
  }

  let decodedEnvironmentUrl: string;
  try {
    decodedEnvironmentUrl = decodeURIComponent(environmentUrlParameter);
  } catch {
    throw new Error(
      hasAccountSpecificUrl ? 'The account WebApp URL is invalid' : 'The configured WebApp environment URL is invalid',
    );
  }

  let webAppUrl: URL;
  try {
    webAppUrl = new URL(decodedEnvironmentUrl);
  } catch {
    throw new Error(
      hasAccountSpecificUrl ? 'The account WebApp URL is invalid' : 'The configured WebApp URL is invalid',
    );
  }

  // pass account id to webview, so we can access it in the preload script
  webAppUrl.searchParams.set('id', parameters.account.id);

  // set the current language
  webAppUrl.searchParams.set('hl', parameters.locale);

  if (
    typeof parameters.account.ssoCode === 'string' &&
    parameters.account.ssoCode.length > 0 &&
    parameters.account.isAdding
  ) {
    webAppUrl.pathname = '/auth';
    webAppUrl.hash = `#sso/${parameters.account.ssoCode}`;
  }

  return webAppUrl.href;
}

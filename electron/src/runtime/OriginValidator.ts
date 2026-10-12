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

import {Maybe} from 'true-myth';

import {URL} from 'url';

export type TrustedOriginsByAccountId = Record<string, string>;

export type NavigationEvent = {
  preventDefault(): void;
};

export type NavigationOrigins = {
  pendingOrigin: Maybe<string>;
  trustedOrigin: Maybe<string>;
};

export type TrustedWebviewAccount = {
  accountId: string;
  trustedOrigin: string;
};

type GetInitialTrustedOriginParameters = {
  accountId: string;
  configuredUrl: Maybe<string>;
  confirmOriginChange: (origin: string) => boolean;
  destinationUrl: string;
  trustedOrigins: unknown;
};

type GetTrustedOriginParameters = {
  accountId: string;
  trustedOrigins: unknown;
};

type GetTrustedWebviewAccountParameters = {
  accountId: Maybe<string>;
  candidateUrl: string;
  trustedOrigins: unknown;
};

type UpdateTrustedOriginParameters = {
  accountId: string;
  origin: string;
  trustedOrigins: unknown;
};

type AuthorizeOriginChangeParameters = {
  confirmOriginChange: (origin: string) => boolean;
  currentTrustedOrigin: Maybe<string>;
  destinationUrl: string;
};

type PreventNavigationOutsideTrustedOriginParameters = {
  destinationUrl: string;
  event: NavigationEvent;
  origins: NavigationOrigins;
};

export function getHttpOrigin(urlString: string): Maybe<string> {
  try {
    const url = new URL(urlString);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username !== '' || url.password !== '') {
      return Maybe.nothing<string>();
    }

    return Maybe.just(url.origin);
  } catch {
    return Maybe.nothing<string>();
  }
}

export function parseTrustedOrigins(trustedOriginsValue: unknown): TrustedOriginsByAccountId {
  const trustedOrigins: TrustedOriginsByAccountId = {};
  if (typeof trustedOriginsValue !== 'object' || trustedOriginsValue === null || Array.isArray(trustedOriginsValue)) {
    return trustedOrigins;
  }

  for (const entry of Object.entries(trustedOriginsValue)) {
    const accountId = entry[0];
    const originValue = entry[1];
    if (typeof originValue !== 'string') {
      continue;
    }

    const origin = getHttpOrigin(originValue);
    if (origin.isJust && origin.value === originValue) {
      trustedOrigins[accountId] = origin.value;
    }
  }

  return trustedOrigins;
}

export function getTrustedOriginForAccount(parameters: GetTrustedOriginParameters): Maybe<string> {
  const trustedOrigins = parseTrustedOrigins(parameters.trustedOrigins);
  if (!Object.prototype.hasOwnProperty.call(trustedOrigins, parameters.accountId)) {
    return Maybe.nothing<string>();
  }

  return Maybe.just(trustedOrigins[parameters.accountId]);
}

export function getTrustedWebviewAccount(parameters: GetTrustedWebviewAccountParameters): Maybe<TrustedWebviewAccount> {
  if (parameters.accountId.isNothing) {
    return Maybe.nothing<TrustedWebviewAccount>();
  }

  const trustedOrigin = getTrustedOriginForAccount({
    accountId: parameters.accountId.value,
    trustedOrigins: parameters.trustedOrigins,
  });
  if (trustedOrigin.isNothing || !isMatchingOrigin(parameters.candidateUrl, trustedOrigin)) {
    return Maybe.nothing<TrustedWebviewAccount>();
  }

  return Maybe.just({accountId: parameters.accountId.value, trustedOrigin: trustedOrigin.value});
}

export function updateTrustedOrigin(parameters: UpdateTrustedOriginParameters): TrustedOriginsByAccountId {
  const trustedOrigins = parseTrustedOrigins(parameters.trustedOrigins);
  const origin = getHttpOrigin(parameters.origin);
  if (origin.isNothing || origin.value !== parameters.origin) {
    return trustedOrigins;
  }

  trustedOrigins[parameters.accountId] = origin.value;
  return trustedOrigins;
}

export function removeTrustedOrigin(accountId: string, trustedOriginsValue: unknown): TrustedOriginsByAccountId {
  const trustedOrigins = parseTrustedOrigins(trustedOriginsValue);
  delete trustedOrigins[accountId];
  return trustedOrigins;
}

export function getInitialTrustedOrigin(parameters: GetInitialTrustedOriginParameters): Maybe<string> {
  const destinationOrigin = getHttpOrigin(parameters.destinationUrl);
  if (destinationOrigin.isNothing) {
    return Maybe.nothing<string>();
  }

  const currentTrustedOrigin = getTrustedOriginForAccount({
    accountId: parameters.accountId,
    trustedOrigins: parameters.trustedOrigins,
  });

  if (currentTrustedOrigin.isJust) {
    if (currentTrustedOrigin.value === destinationOrigin.value) {
      return destinationOrigin;
    }

    if (!parameters.confirmOriginChange(destinationOrigin.value)) {
      return Maybe.nothing<string>();
    }

    return destinationOrigin;
  }

  const configuredOrigin = parameters.configuredUrl.andThen(getHttpOrigin);
  if (configuredOrigin.isJust && configuredOrigin.value === destinationOrigin.value) {
    return destinationOrigin;
  }

  if (!parameters.confirmOriginChange(destinationOrigin.value)) {
    return Maybe.nothing<string>();
  }

  return destinationOrigin;
}

export function authorizeOriginChange(parameters: AuthorizeOriginChangeParameters): Maybe<string> {
  const destinationOrigin = getHttpOrigin(parameters.destinationUrl);
  const currentTrustedOrigin = parameters.currentTrustedOrigin.andThen(getHttpOrigin);

  if (destinationOrigin.isNothing || currentTrustedOrigin.isNothing) {
    return Maybe.nothing<string>();
  }

  if (destinationOrigin.value === currentTrustedOrigin.value) {
    return destinationOrigin;
  }

  if (!parameters.confirmOriginChange(destinationOrigin.value)) {
    return Maybe.nothing<string>();
  }

  return destinationOrigin;
}

export function isAllowedNavigation(destinationUrl: string, origins: NavigationOrigins): boolean {
  if (origins.trustedOrigin.isJust && isMatchingOrigin(destinationUrl, origins.trustedOrigin)) {
    return true;
  }

  if (origins.pendingOrigin.isJust && isMatchingOrigin(destinationUrl, origins.pendingOrigin)) {
    return true;
  }

  return false;
}

export function isMatchingOrigin(destinationUrl: string, trustedUrl: Maybe<string>): boolean {
  const destinationOrigin = getHttpOrigin(destinationUrl);
  const trustedOrigin = trustedUrl.andThen(getHttpOrigin);

  return destinationOrigin.isJust && trustedOrigin.isJust && destinationOrigin.value === trustedOrigin.value;
}

export function preventNavigationOutsideTrustedOrigin(
  parameters: PreventNavigationOutsideTrustedOriginParameters,
): boolean {
  if (isAllowedNavigation(parameters.destinationUrl, parameters.origins)) {
    return true;
  }

  parameters.event.preventDefault();
  return false;
}

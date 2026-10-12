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

function getHttpOrigin(urlString: string): Maybe<string> {
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

export const OriginValidator = {
  getHttpOrigin,

  isMatchingOrigin(destinationUrl: string, trustedUrl: Maybe<string>): boolean {
    const destinationOrigin = getHttpOrigin(destinationUrl);
    const trustedOrigin = trustedUrl.andThen(getHttpOrigin);

    return destinationOrigin.isJust && trustedOrigin.isJust && destinationOrigin.value === trustedOrigin.value;
  },

  preventNavigationOutsideTrustedOrigin(parameters: {
    destinationUrl: string;
    event: {preventDefault(): void};
    trustedOrigin: Maybe<string>;
  }): boolean {
    if (OriginValidator.isMatchingOrigin(parameters.destinationUrl, parameters.trustedOrigin)) {
      return true;
    }

    parameters.event.preventDefault();
    return false;
  },

  initializeTrustedOrigin(parameters: {
    accountId: string;
    configuredUrls: readonly string[];
    confirmOriginChange: (origin: string) => boolean;
    destinationUrl: string;
    trustedOriginsByAccountId: Map<string, string>;
  }): boolean {
    const destinationOrigin = getHttpOrigin(parameters.destinationUrl);
    const configuredOrigins = parameters.configuredUrls
      .map(configuredUrl => {
        return getHttpOrigin(configuredUrl);
      })
      .filter(origin => {
        return origin.isJust;
      })
      .map(origin => {
        return origin.value;
      });

    if (destinationOrigin.isNothing || configuredOrigins.length === 0) {
      return false;
    }

    const currentTrustedOrigin = Maybe.of(parameters.trustedOriginsByAccountId.get(parameters.accountId));
    if (currentTrustedOrigin.isJust && currentTrustedOrigin.value === destinationOrigin.value) {
      return true;
    }

    const isConfiguredOrigin = configuredOrigins.includes(destinationOrigin.value);
    const requiresConfirmation = currentTrustedOrigin.isJust || !isConfiguredOrigin;
    if (requiresConfirmation && !parameters.confirmOriginChange(destinationOrigin.value)) {
      return false;
    }

    parameters.trustedOriginsByAccountId.set(parameters.accountId, destinationOrigin.value);
    return true;
  },

  authorizeOriginChange(parameters: {
    accountId: string;
    confirmOriginChange: (origin: string) => boolean;
    destinationUrl: string;
    trustedOriginsByAccountId: Map<string, string>;
  }): boolean {
    const destinationOrigin = getHttpOrigin(parameters.destinationUrl);
    const currentTrustedOrigin = Maybe.of(parameters.trustedOriginsByAccountId.get(parameters.accountId));

    if (destinationOrigin.isNothing || currentTrustedOrigin.isNothing) {
      return false;
    }

    const isOriginChange = currentTrustedOrigin.value !== destinationOrigin.value;
    if (isOriginChange && !parameters.confirmOriginChange(destinationOrigin.value)) {
      return false;
    }

    parameters.trustedOriginsByAccountId.set(parameters.accountId, destinationOrigin.value);
    return true;
  },
};

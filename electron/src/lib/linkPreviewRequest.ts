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

import ipaddr from 'ipaddr.js';
import {Result} from 'true-myth';

import {URL} from 'url';

function getHostnameWithoutBrackets(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

export function isPublicNetworkAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) {
    return false;
  }

  return ipaddr.process(address).range() === 'unicast';
}

export function normalizeAndValidateUrl(url: string, baseUrl?: URL): Result<URL, Error> {
  let normalizedUrl: URL;

  try {
    if (baseUrl instanceof URL) {
      normalizedUrl = new URL(url, baseUrl);
    } else {
      normalizedUrl = new URL(url);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Result.err(new Error(`Invalid URL: "${url}"`, {cause: error}));
    }

    return Result.err(new Error(`Invalid URL: "${url}"`));
  }

  if (normalizedUrl.protocol !== 'http:' && normalizedUrl.protocol !== 'https:') {
    return Result.err(new Error(`Unsupported URL protocol: "${normalizedUrl.protocol}"`));
  }

  if (normalizedUrl.username.length > 0 || normalizedUrl.password.length > 0) {
    return Result.err(new Error(`URL credentials are not supported: "${url}"`));
  }

  const hostname = getHostnameWithoutBrackets(normalizedUrl.hostname);
  if (ipaddr.isValid(hostname) && !isPublicNetworkAddress(hostname)) {
    return Result.err(new Error(`Blocked non-public network destination: "${hostname}"`));
  }

  return Result.ok(normalizedUrl);
}

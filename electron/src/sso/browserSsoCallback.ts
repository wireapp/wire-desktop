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

import type {CookiesSetDetails} from 'electron';

import {parseSsoPayload, SsoPayload} from './ssoResult';

export const SSO_TIMEOUT_MS = 30 * 60 * 1000;

export function createBrowserSsoRequest(loginUrl: string, scheme: string, state: string): URL {
  const url = new URL(loginUrl);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    !/^\/sso\/initiate-login\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(url.pathname) ||
    !/^[a-z][a-z0-9+.-]*$/.test(scheme)
  ) {
    throw new Error('Invalid SSO login URL.');
  }
  const success = new URL(`${scheme}://login/success`);
  success.searchParams.set('cookie', '$cookie');
  success.searchParams.set('userid', '$userid');
  success.searchParams.set('validation_token', state);
  const failure = new URL(`${scheme}://login/failure`);
  failure.searchParams.set('label', '$label');
  failure.searchParams.set('validation_token', state);
  // Keep literal placeholders inside the redirect, as iOS does. Encode only the
  // outer query; double-encoding the dollar sign breaks backend substitution.
  url.searchParams.set(
    'success_redirect',
    success.toString().replace('%24cookie', '$cookie').replace('%24userid', '$userid'),
  );
  url.searchParams.set('error_redirect', failure.toString().replace('%24label', '$label'));
  return url;
}

export function parseBrowserSsoCallback(
  callback: string,
  backend: URL,
  scheme: string,
  state: string,
  expiresAt: number,
): CookiesSetDetails | {type: 'AUTH_ERROR'; payload: SsoPayload} {
  if (Date.now() >= expiresAt || callback.length > 16384) {
    throw new Error('Expired or oversized SSO callback.');
  }
  const url = new URL(callback);
  if (
    url.protocol !== `${scheme}:` ||
    url.host !== 'login' ||
    url.username ||
    url.password ||
    url.hash ||
    url.searchParams.getAll('validation_token').length !== 1 ||
    url.searchParams.get('validation_token') !== state
  ) {
    throw new Error('Invalid SSO callback.');
  }
  if (url.pathname === '/failure') {
    const payload = parseSsoPayload({label: url.searchParams.get('label')});
    if (url.searchParams.getAll('label').length !== 1 || !payload) {
      throw new Error('Invalid SSO failure callback.');
    }
    return {type: 'AUTH_ERROR', payload};
  }
  if (url.pathname !== '/success') {
    throw new Error('SSO authentication failed.');
  }
  if (
    url.searchParams.getAll('cookie').length !== 1 ||
    url.searchParams.getAll('userid').length !== 1 ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(url.searchParams.get('userid') || '')
  ) {
    throw new Error('Invalid SSO callback fields.');
  }
  const header = url.searchParams.get('cookie')!;
  if (/[\r\n\0]/.test(header)) {
    throw new Error('Invalid SSO cookie.');
  }
  const [pair, ...attributes] = header.split(';').map(part => part.trim());
  const match = /^zuid=([\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+)$/.exec(pair);
  if (!match) {
    throw new Error('Missing Wire session cookie.');
  }
  const cookie: CookiesSetDetails = {
    url: new URL('/access', backend.origin).toString(),
    name: 'zuid',
    value: match[1],
    path: '/access',
    secure: true,
    httpOnly: true,
  };
  const seen = new Set<string>();
  for (const attribute of attributes) {
    const index = attribute.indexOf('=');
    const name = (index < 0 ? attribute : attribute.slice(0, index)).toLowerCase();
    const value = index < 0 ? '' : attribute.slice(index + 1);
    if (seen.has(name)) {
      throw new Error('Duplicate cookie attribute.');
    }
    seen.add(name);
    if (name === 'domain' && value.replace(/^\./, '').toLowerCase() !== backend.hostname.toLowerCase()) {
      throw new Error('Unexpected cookie domain.');
    }
    // Store host-only, even if the backend supplied a Domain attribute.
    if (name === 'path') {
      if (value !== '/' && value !== '/access') {
        throw new Error('Unexpected cookie path.');
      }
      cookie.path = value;
    }
    if (name === 'expires') {
      cookie.expirationDate = Date.parse(value) / 1000;
      if (!Number.isFinite(cookie.expirationDate)) {
        throw new Error('Invalid cookie expiry.');
      }
    }
    if (name === 'samesite') {
      const sameSite = {none: 'no_restriction', lax: 'lax', strict: 'strict'} as const;
      if (!Object.prototype.hasOwnProperty.call(sameSite, value.toLowerCase())) {
        throw new Error('Invalid SameSite attribute.');
      }
      cookie.sameSite = sameSite[value.toLowerCase() as keyof typeof sameSite];
    }
  }
  const maxAge = attributes.find(attribute => /^max-age=/i.test(attribute));
  if (maxAge) {
    const age = maxAge.slice(maxAge.indexOf('=') + 1);
    if (!/^\d+$/.test(age) || !Number.isSafeInteger(Number(age))) {
      throw new Error('Invalid cookie Max-Age.');
    }
    cookie.expirationDate = Date.now() / 1000 + Number(age);
  }
  if (cookie.expirationDate !== undefined && cookie.expirationDate <= Date.now() / 1000) {
    throw new Error('Expired SSO cookie.');
  }
  return cookie;
}

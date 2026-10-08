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

import * as assert from 'assert';

import {createBrowserSsoRequest, parseBrowserSsoCallback} from './browserSsoCallback';

const backend = new URL('https://backend.example/sso/initiate-login/11111111-1111-1111-1111-111111111111');
const state = 'test-state';
const expiry = () => Date.now() + 60000;
const callback = (cookie = 'zuid=test-session; Path=/access; Secure; HttpOnly') => {
  const url = new URL('wire://login/success');
  url.searchParams.set('validation_token', state);
  url.searchParams.set('userid', '11111111-1111-1111-1111-111111111111');
  url.searchParams.set('cookie', cookie);
  return url;
};
const parse = (url: URL) => parseBrowserSsoCallback(url.toString(), backend, 'wire', state, expiry());

describe('browser SSO callback', () => {
  it('uses the iOS backend redirect templates and replaces caller-supplied redirects', () => {
    const url = createBrowserSsoRequest(`${backend}?success_redirect=https://evil.example`, 'wire', state);
    assert.ok(url.searchParams.get('success_redirect')!.includes('cookie=$cookie&userid=$userid'));
    assert.ok(url.searchParams.get('error_redirect')!.includes('label=$label'));
    const success = new URL(url.searchParams.get('success_redirect')!);
    assert.strictEqual(success.searchParams.get('cookie'), '$cookie');
    assert.strictEqual(success.searchParams.get('userid'), '$userid');
    assert.strictEqual(success.searchParams.get('validation_token'), state);
    assert.strictEqual(success.origin, 'null');
    assert.strictEqual(success.host, 'login');
  });

  it('preserves validated failure labels and rejects duplicate labels or wrong state', () => {
    const url = new URL(`wire://login/failure?label=forbidden&validation_token=${state}`);
    assert.deepStrictEqual(parse(url), {type: 'AUTH_ERROR', payload: {label: 'forbidden'}});
    url.searchParams.set('validation_token', 'wrong');
    assert.throws(() => parse(url));
    url.searchParams.set('validation_token', state);
    url.searchParams.append('label', 'other');
    assert.throws(() => parse(url));
  });

  it('rejects non-HTTPS, credentials and non-SSO initiation URLs', () => {
    for (const url of [
      'http://backend.example/sso/initiate-login/x',
      'https://user:pass@backend.example/sso/initiate-login/x',
      'https://backend.example/other',
    ]) {
      assert.throws(() => createBrowserSsoRequest(url, 'wire', state));
    }
  });

  it('accepts only the Wire cookie and scopes it to the initiating backend', () => {
    const cookie = parse(callback());
    if ('type' in cookie) {
      throw new Error('Expected a success cookie');
    }
    assert.strictEqual(cookie.url, 'https://backend.example/access');
    assert.strictEqual(cookie.value, 'test-session');
    assert.strictEqual(cookie.domain, undefined);
    assert.strictEqual(cookie.secure, true);
    assert.strictEqual(cookie.httpOnly, true);
  });

  it('rejects wrong state, duplicate state, wrong scheme, host, path, expired and oversized callbacks', () => {
    for (const mutate of [
      (url: URL) => url.searchParams.set('validation_token', 'other'),
      (url: URL) => url.searchParams.append('validation_token', state),
      (url: URL) => {
        url.protocol = 'other:';
      },
      (url: URL) => {
        url.host = 'other';
      },
      (url: URL) => {
        url.pathname = '/failure';
      },
      (url: URL) => url.searchParams.append('cookie', 'zuid=other'),
    ]) {
      const url = callback();
      mutate(url);
      assert.throws(() => parse(url));
    }
    assert.throws(() => parseBrowserSsoCallback(callback().toString(), backend, 'wire', state, Date.now() - 1));
    assert.throws(() => parseBrowserSsoCallback('x'.repeat(16385), backend, 'wire', state, expiry()));
  });

  it('rejects foreign domains, unrelated cookies, header injection, invalid paths and expiry', () => {
    for (const cookie of [
      'other=value',
      'zuid=value; Domain=evil.example',
      'zuid=value; SameSite=__proto__',
      'zuid=value; Path=/other',
      'zuid=value\r\nSet-Cookie: other=value',
      'zuid=value; Max-Age=0',
      'zuid=value; Expires=invalid',
      'zuid=value; Path=/; Path=/access',
      'zuid=value; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ]) {
      assert.throws(() => parse(callback(cookie)));
    }
  });
});

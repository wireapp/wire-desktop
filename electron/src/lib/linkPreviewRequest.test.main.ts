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

import assert from 'node:assert';

import {isPublicNetworkAddress, normalizeAndValidateUrl} from './linkPreviewRequest';

describe('link preview request URL policy', () => {
  function testPublicAddress(publicAddress: string): () => void {
    return () => {
      const actualIsPublic = isPublicNetworkAddress(publicAddress);

      assert.strictEqual(actualIsPublic, true, publicAddress);
    };
  }

  function testNonPublicAddress(nonPublicAddress: string): () => void {
    return () => {
      const actualIsPublic = isPublicNetworkAddress(nonPublicAddress);

      assert.strictEqual(actualIsPublic, false, nonPublicAddress);
    };
  }

  function testInvalidUrl(url: string): () => void {
    return () => {
      const actualResult = normalizeAndValidateUrl(url);

      assert.strictEqual(actualResult.isErr, true, url);
    };
  }

  it('allows a public IPv4 address', testPublicAddress('8.8.8.8'));

  it('allows a public IPv6 address', testPublicAddress('2001:4860:4860::8888'));

  it('allows a public IPv4-mapped IPv6 address', testPublicAddress('::ffff:8.8.8.8'));

  it('rejects IPv4 loopback', testNonPublicAddress('127.0.0.1'));

  it('rejects shorthand IPv4 loopback', testNonPublicAddress('127.1'));

  it('rejects private 10/8 IPv4 addresses', testNonPublicAddress('10.0.0.1'));

  it('rejects private 172.16/12 IPv4 addresses', testNonPublicAddress('172.16.0.1'));

  it('rejects private 192.168/16 IPv4 addresses', testNonPublicAddress('192.168.0.1'));

  it('rejects carrier-grade NAT IPv4 addresses', testNonPublicAddress('100.64.0.1'));

  it('rejects IPv4 link-local metadata addresses', testNonPublicAddress('169.254.169.254'));

  it('rejects IPv4 multicast addresses', testNonPublicAddress('224.0.0.1'));

  it('rejects unspecified IPv4 addresses', testNonPublicAddress('0.0.0.0'));

  it('rejects reserved 192.0.0.0/24 IPv4 addresses', testNonPublicAddress('192.0.0.1'));

  it('rejects documentation 192.0.2.0/24 IPv4 addresses', testNonPublicAddress('192.0.2.1'));

  it('rejects benchmark 198.18.0.0/15 IPv4 addresses', testNonPublicAddress('198.18.0.1'));

  it('rejects documentation 198.51.100.0/24 IPv4 addresses', testNonPublicAddress('198.51.100.1'));

  it('rejects documentation 203.0.113.0/24 IPv4 addresses', testNonPublicAddress('203.0.113.1'));

  it('rejects IPv4 broadcast addresses', testNonPublicAddress('255.255.255.255'));

  it('rejects IPv6 loopback', testNonPublicAddress('::1'));

  it('rejects unspecified IPv6 addresses', testNonPublicAddress('::'));

  it('rejects IPv6 link-local addresses', testNonPublicAddress('fe80::1'));

  it('rejects IPv6 unique-local addresses', testNonPublicAddress('fc00::1'));

  it('rejects IPv6 multicast addresses', testNonPublicAddress('ff02::1'));

  it('rejects IPv6 documentation addresses', testNonPublicAddress('2001:db8::1'));

  it('rejects IPv4-mapped IPv6 loopback', testNonPublicAddress('::ffff:127.0.0.1'));

  it('rejects IPv4-mapped IPv6 private addresses', testNonPublicAddress('::ffff:10.0.0.1'));

  it('rejects shorthand IPv4-mapped IPv6 private addresses', testNonPublicAddress('::ffff:c0a8:1'));

  it('allows HTTP URLs', () => {
    const actualResult = normalizeAndValidateUrl('http://8.8.8.8');

    assert.strictEqual(actualResult.isOk, true);
  });

  it('allows HTTPS IPv6 URLs', () => {
    const actualResult = normalizeAndValidateUrl('https://[2001:4860:4860::8888]');

    assert.strictEqual(actualResult.isOk, true);
  });

  it('rejects file URLs', testInvalidUrl('file:///etc/passwd'));

  it('rejects FTP URLs', testInvalidUrl('ftp://example.com/file'));

  it('rejects JavaScript URLs', testInvalidUrl('javascript:alert(1)'));

  it('rejects URLs containing credentials', testInvalidUrl('https://user:password@8.8.8.8'));

  it('rejects literal IPv4 loopback URLs', testInvalidUrl('http://127.0.0.1'));

  it('rejects literal shorthand IPv4 loopback URLs', testInvalidUrl('http://127.1'));

  it('rejects literal private IPv4 URLs', testInvalidUrl('http://10.0.0.1'));

  it('rejects literal IPv4 metadata URLs', testInvalidUrl('http://169.254.169.254'));

  it('rejects literal IPv6 loopback URLs', testInvalidUrl('http://[::1]'));

  it('rejects literal IPv6 link-local URLs', testInvalidUrl('http://[fe80::1]'));

  it('rejects literal IPv6 unique-local URLs', testInvalidUrl('http://[fc00::1]'));

  it('rejects literal IPv4-mapped IPv6 private URLs', testInvalidUrl('http://[::ffff:10.0.0.1]'));

  it('resolves relative URLs against a validated base URL', () => {
    const baseUrlResult = normalizeAndValidateUrl('https://example.com/path/page');
    assert(baseUrlResult.isOk);

    const actualResult = normalizeAndValidateUrl('../image.png', baseUrlResult.value);
    assert(actualResult.isOk);
    assert.strictEqual(actualResult.value.href, 'https://example.com/image.png');
  });
});

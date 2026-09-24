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

import nock, {cleanAll} from 'nock';

import {lookup as dnsLookup} from 'dns';
import assert from 'node:assert';

import {
  isPublicNetworkAddress,
  LinkPreviewImageRequest,
  LinkPreviewStreamRequest,
  normalizeAndValidateUrl,
  requestLinkPreviewImage,
  requestLinkPreviewStream,
} from './linkPreviewRequest';
import type {LinkPreviewRequestDependencies} from './linkPreviewRequest';

const linkPreviewRequestDependencies: LinkPreviewRequestDependencies = {dnsLookup};

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
      const actualResult = normalizeAndValidateUrl(url, undefined);

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
    const actualResult = normalizeAndValidateUrl('http://8.8.8.8', undefined);

    assert.strictEqual(actualResult.isOk, true);
  });

  it('allows HTTPS IPv6 URLs', () => {
    const actualResult = normalizeAndValidateUrl('https://[2001:4860:4860::8888]', undefined);

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
    const baseUrlResult = normalizeAndValidateUrl('https://example.com/path/page', undefined);
    assert(baseUrlResult.isOk);

    const actualResult = normalizeAndValidateUrl('../image.png', baseUrlResult.value);
    assert(actualResult.isOk);
    assert.strictEqual(actualResult.value.href, 'https://example.com/image.png');
  });
});

describe('link preview request connection policy', () => {
  afterEach(() => {
    cleanAll();
  });

  it('rejects a hostname when the actual socket lookup returns a private address', async () => {
    function dnsLookup(
      _hostname: string,
      _options: import('dns').LookupAllOptions,
      callback: (error: NodeJS.ErrnoException | null, addresses: import('dns').LookupAddress[]) => void,
    ): void {
      callback(null, [{address: '10.0.0.1', family: 4}]);
    }

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://attacker.example/image.png',
      userAgent: 'Wire Test',
    };

    await assert.rejects(() => {
      return requestLinkPreviewImage(request, {dnsLookup});
    }, /Blocked non-public network destination/);
  });

  it('uses the injected lookup for a public hostname connection', async () => {
    function dnsLookup(
      _hostname: string,
      _options: import('dns').LookupAllOptions,
      callback: (error: NodeJS.ErrnoException | null, addresses: import('dns').LookupAddress[]) => void,
    ): void {
      callback(null, [{address: '93.184.216.34', family: 4}]);
    }

    nock('https://public.example').get('/image.png').reply(200, Buffer.from('image'), {
      'content-type': 'image/png',
    });

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://public.example/image.png',
      userAgent: 'Wire Test',
    };

    const actualResponse = await requestLinkPreviewImage(request, {dnsLookup});

    assert.strictEqual(actualResponse.status, 200);
  });

  it('returns a stream for a stream request', async () => {
    nock('https://public.example').get('/index.html').reply(200, '<html></html>', {
      'content-type': 'text/html',
    });

    const request: LinkPreviewStreamRequest = {
      responseType: 'stream',
      url: 'https://public.example/index.html',
      userAgent: 'Wire Test',
    };

    const actualResponse = await requestLinkPreviewStream(request, linkPreviewRequestDependencies);

    assert.strictEqual(actualResponse.status, 200);
    assert.strictEqual(typeof actualResponse.data.pipe, 'function');
    actualResponse.data.destroy();
  });

  it('follows a relative public redirect', async () => {
    nock('https://example.com').get('/redirect').reply(302, '', {location: '/target'});
    nock('https://example.com').get('/target').reply(200, Buffer.from('image'), {'content-type': 'image/png'});

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://example.com/redirect',
      userAgent: 'Wire Test',
    };

    const actualResponse = await requestLinkPreviewImage(request, linkPreviewRequestDependencies);

    assert.strictEqual(actualResponse.status, 200);
  });

  it('rejects a redirect to a literal private address', async () => {
    nock('https://example.com').get('/redirect').reply(302, '', {location: 'http://169.254.169.254/latest'});

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://example.com/redirect',
      userAgent: 'Wire Test',
    };

    await assert.rejects(() => {
      return requestLinkPreviewImage(request, linkPreviewRequestDependencies);
    }, /Blocked non-public network destination/);
  });

  it('rejects a redirect hostname when its socket lookup returns a private address', async () => {
    nock('https://example.com').get('/redirect').reply(302, '', {location: 'https://attacker.example/latest'});

    function dnsLookup(
      hostname: string,
      _options: import('dns').LookupAllOptions,
      callback: (error: NodeJS.ErrnoException | null, addresses: import('dns').LookupAddress[]) => void,
    ): void {
      if (hostname === 'attacker.example') {
        callback(null, [{address: '10.0.0.1', family: 4}]);
        return;
      }

      callback(null, [{address: '93.184.216.34', family: 4}]);
    }

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://example.com/redirect',
      userAgent: 'Wire Test',
    };

    await assert.rejects(() => {
      return requestLinkPreviewImage(request, {dnsLookup});
    }, /Blocked non-public network destination/);
  });

  it('enforces the redirect limit', async () => {
    nock('https://example.com').get('/redirect-0').reply(302, '', {location: '/redirect-1'});
    nock('https://example.com').get('/redirect-1').reply(302, '', {location: '/redirect-2'});
    nock('https://example.com').get('/redirect-2').reply(302, '', {location: '/redirect-3'});
    nock('https://example.com').get('/redirect-3').reply(302, '', {location: '/redirect-4'});
    nock('https://example.com').get('/redirect-4').reply(302, '', {location: '/redirect-5'});
    nock('https://example.com').get('/redirect-5').reply(302, '', {location: '/redirect-6'});

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://example.com/redirect-0',
      userAgent: 'Wire Test',
    };

    await assert.rejects(() => {
      return requestLinkPreviewImage(request, linkPreviewRequestDependencies);
    }, /Too many redirects/);
  });

  it('does not forward cookies or credentials across redirects', async () => {
    nock('https://example.com').get('/cookie-redirect').reply(302, '', {
      location: '/cookie-target',
      'set-cookie': 'session=secret',
    });
    nock('https://example.com', {badheaders: ['cookie', 'authorization', 'proxy-authorization']})
      .get('/cookie-target')
      .reply(200, Buffer.from('image'), {'content-type': 'image/png'});

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://example.com/cookie-redirect',
      userAgent: 'Wire Test',
    };

    const actualResponse = await requestLinkPreviewImage(request, linkPreviewRequestDependencies);

    assert.strictEqual(actualResponse.status, 200);
  });

  it('does not send cookies or credentials', async () => {
    nock('https://example.com', {badheaders: ['cookie', 'authorization', 'proxy-authorization']})
      .get('/')
      .reply(200, Buffer.from('image'), {'content-type': 'image/png'});

    const request: LinkPreviewImageRequest = {
      responseType: 'arraybuffer',
      url: 'https://example.com/',
      userAgent: 'Wire Test',
    };

    const actualResponse = await requestLinkPreviewImage(request, linkPreviewRequestDependencies);

    assert.strictEqual(actualResponse.status, 200);
  });
});

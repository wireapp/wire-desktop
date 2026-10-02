/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import assert from 'node:assert';

import {fetchOpenGraphHtml, getOpenGraphDataAsync} from './openGraph';

import {config} from '../settings/config';

const exampleUrl = 'https://example.com';
const defaultMessage = 'Hello from nock!';
const defaultMessageUtf8 = [72, 101, 108, 108, 111, 32, 102, 114, 111, 109, 32, 110, 111, 99, 107, 33];

const russianMessage = 'Привет из нока!';
const russianMessageKoi8r = [240, 210, 201, 215, 197, 212, 32, 201, 218, 32, 206, 207, 203, 193, 33];
// eslint-disable-next-line
const russianMessageUtf8 = [
  208, 159, 209, 128, 208, 184, 208, 178, 208, 181, 209, 130, 32, 208, 184, 208, 183, 32, 208, 189, 208, 190, 208, 186,
  208, 176, 33,
];

function contentLimitRequest(contentType: string, contentArray: number[]) {
  const contentSizeLimit = 1e6; // ~1MB
  nock(exampleUrl).get('/').reply(200, Buffer.from(contentArray), {
    'content-type': contentType,
  });
  return fetchOpenGraphHtml(exampleUrl, config.userAgent, contentSizeLimit);
}

describe('openGraph', () => {
  afterEach(() => {
    cleanAll();
  });

  it('decodes a text encoded with UTF-8', async () => {
    const result = await contentLimitRequest('text/html; charset=utf-8', defaultMessageUtf8);
    assert.strictEqual(result, defaultMessage);
  });

  it('decodes a russian text encoded with koi8-r', async () => {
    const result = await contentLimitRequest('text/html; charset=koi8-r', russianMessageKoi8r);
    assert.strictEqual(result, russianMessage);
  });

  it('decodes a russian text encoded with UTF-8', async () => {
    const result = await contentLimitRequest('text/html; charset=utf-8', russianMessageUtf8);
    assert.strictEqual(result, russianMessage);
  });

  it('defaults to utf8 on invalid charsets', async () => {
    const result = await contentLimitRequest('text/html; charset=invalid', defaultMessageUtf8);
    assert.strictEqual(result, defaultMessage);
  });

  it('defaults to utf8 on missing charset', async () => {
    const result = await contentLimitRequest('text/html', defaultMessageUtf8);
    assert.strictEqual(result, defaultMessage);
  });

  it('throws on missing content type', async () => {
    try {
      await contentLimitRequest('', []);
      assert.fail(`Request didn't throw`);
    } catch (error: unknown) {
      assert(error instanceof Error);
      assert.strictEqual(error.message.includes('Could not parse content type'), true);
    }
  });

  it('fetches normal OpenGraph metadata through the protected requester', async () => {
    nock(exampleUrl)
      .get('/metadata')
      .reply(200, '<html><head><meta property="og:description" content="A preview"></head></html>', {
        'content-type': 'text/html',
      });

    const actualMetadata = await getOpenGraphDataAsync(`${exampleUrl}/metadata`);

    assert.strictEqual(actualMetadata.description, 'A preview');
  });

  it('selects Twitter user agents per request without changing later requests', async () => {
    const configuredUserAgent = config.userAgent;
    const htmlResponse = '<html><head><meta property="og:description" content="A preview"></head></html>';

    nock('https://twitter.com')
      .get('/')
      .matchHeader('user-agent', 'Twitterbot/1.0')
      .reply(200, htmlResponse, {'content-type': 'text/html'});
    nock(exampleUrl)
      .get('/')
      .matchHeader('user-agent', configuredUserAgent)
      .reply(200, htmlResponse, {'content-type': 'text/html'});
    nock('https://eviltwitter.com')
      .get('/')
      .matchHeader('user-agent', configuredUserAgent)
      .reply(200, htmlResponse, {'content-type': 'text/html'});

    await getOpenGraphDataAsync('https://twitter.com');
    await getOpenGraphDataAsync(exampleUrl);
    await getOpenGraphDataAsync('https://eviltwitter.com');

    assert.strictEqual(config.userAgent, configuredUserAgent);
  });

  it('fetches OpenGraph images through the protected requester', async () => {
    nock(exampleUrl)
      .get('/image-page')
      .reply(200, '<html><head><meta property="og:image" content="https://example.com/image"></head></html>', {
        'content-type': 'text/html',
      });
    nock(exampleUrl).get('/image').reply(200, Buffer.from('image'), {'content-type': 'image/png'});

    const actualMetadata = await getOpenGraphDataAsync(`${exampleUrl}/image-page`);
    const actualImage = actualMetadata.image;
    if (typeof actualImage !== 'object' || actualImage === null || Array.isArray(actualImage)) {
      assert.fail('Expected an OpenGraph image object');
    }

    assert.strictEqual(actualImage.url, 'data:image/png;base64,aW1hZ2U=');
  });

  it('ignores an OpenGraph image with a private literal destination', async () => {
    nock(exampleUrl)
      .get('/private-image-page')
      .reply(200, '<html><head><meta property="og:image" content="http://169.254.169.254/latest"></head></html>', {
        'content-type': 'text/html',
      });

    const actualMetadata = await getOpenGraphDataAsync(`${exampleUrl}/private-image-page`);

    assert.strictEqual(actualMetadata.image, undefined);
  });

  it('ignores an OpenGraph image redirected to a private destination', async () => {
    nock(exampleUrl)
      .get('/redirected-image-page')
      .reply(200, '<html><head><meta property="og:image" content="https://example.com/image-redirect"></head></html>', {
        'content-type': 'text/html',
      });
    nock(exampleUrl).get('/image-redirect').reply(302, '', {
      location: 'http://169.254.169.254/latest/meta-data/',
    });

    const actualMetadata = await getOpenGraphDataAsync(`${exampleUrl}/redirected-image-page`);

    assert.strictEqual(actualMetadata.image, undefined);
  });

  it('ignores an OpenGraph image with an unsupported content type', async () => {
    nock(exampleUrl)
      .get('/not-an-image-page')
      .reply(200, '<html><head><meta property="og:image" content="https://example.com/not-an-image"></head></html>', {
        'content-type': 'text/html',
      });
    nock(exampleUrl).get('/not-an-image').reply(200, 'not an image', {'content-type': 'text/plain'});

    const actualMetadata = await getOpenGraphDataAsync(`${exampleUrl}/not-an-image-page`);

    assert.strictEqual(actualMetadata.image, undefined);
  });
});

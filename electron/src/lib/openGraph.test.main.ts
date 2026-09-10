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

import * as assert from 'assert';

import {getOpenGraphDataAsync} from './openGraph';

const host = 'https://93.184.216.34';

const page = (image?: string): string =>
  `<html><head><meta property="og:title" content="Title"><meta property="og:description" content="Desc">${
    image ? `<meta property="og:image" content="${image}">` : ''
  }</head></html>`;

describe('openGraph', () => {
  afterEach(() => cleanAll());

  it('returns metadata with the preview image inlined as base64', async () => {
    nock(host)
      .get('/')
      .reply(200, page(`${host}/a.png`), {'content-type': 'text/html'});
    nock(host)
      .get('/a.png')
      .reply(200, Buffer.from([1, 2, 3]), {'content-type': 'image/png'});

    const result = await getOpenGraphDataAsync(`${host}/`);

    assert.strictEqual(result.title, 'Title');
    assert.strictEqual(result.description, 'Desc');
    assert.strictEqual(result.image?.data, 'data:image/png;base64,AQID');
  });

  it('decodes pages using the charset from the content type', async () => {
    const koi8rTitle = Buffer.from([240, 210, 201, 215, 197, 212]);
    const body = Buffer.concat([
      Buffer.from('<html><head><meta property="og:title" content="'),
      koi8rTitle,
      Buffer.from('"><meta property="og:type" content="website"></head></html>'),
    ]);
    nock(host).get('/').reply(200, body, {'content-type': 'text/html; charset=koi8-r'});

    const result = await getOpenGraphDataAsync(`${host}/`);

    assert.strictEqual(result.title, 'Привет');
  });

  it('drops the image when the response is not an image', async () => {
    nock(host)
      .get('/')
      .reply(200, page(`${host}/a.png`), {'content-type': 'text/html'});
    nock(host).get('/a.png').reply(200, '<html></html>', {'content-type': 'text/html'});

    const result = await getOpenGraphDataAsync(`${host}/`);

    assert.strictEqual(result.title, 'Title');
    assert.strictEqual(result.image, undefined);
  });

  it('drops the image when it points at a private address', async () => {
    nock(host).get('/').reply(200, page('https://10.0.0.9/a.png'), {'content-type': 'text/html'});

    const result = await getOpenGraphDataAsync(`${host}/`);

    assert.strictEqual(result.title, 'Title');
    assert.strictEqual(result.image, undefined);
  });

  it('rejects http URLs', async () => {
    await assert.rejects(getOpenGraphDataAsync('http://93.184.216.34/'), /https/);
  });

  it('rejects private addresses', async () => {
    await assert.rejects(getOpenGraphDataAsync('https://127.0.0.1/'), /private/);
  });

  it('throws when the page carries no open graph data', async () => {
    nock(host).get('/').reply(200, '<html><head><title>x</title></head></html>', {'content-type': 'text/html'});

    await assert.rejects(getOpenGraphDataAsync(`${host}/`), /No openGraph data found/);
  });
});

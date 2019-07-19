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

import * as assert from 'assert';
import nock from 'nock';

import {axiosWithContentLimit} from './openGraph';

const exampleUrl = 'https://example.com';
const defaultMessage = 'Hello from nock!';
const defaultMessageUtf8 = [72, 101, 108, 108, 111, 32, 102, 114, 111, 109, 32, 110, 111, 99, 107, 33];

const russianMessage = 'Привет из nock!';
const russianMessageKoi8r = [240, 210, 201, 215, 197, 212, 32, 201, 218, 32, 110, 111, 99, 107, 33];
/* tslint:disable-next-line */
const russianMessageUtf8 = [208, 159, 209, 128, 208, 184, 208, 178, 208, 181, 209, 130, 32, 208, 184, 208, 183, 32, 110, 111, 99, 107, 33];

const doRequest = (contentType: string, contentArray: number[]) => {
  nock(exampleUrl)
    .get('/')
    .reply(() => {
      return [
        200,
        Buffer.from(contentArray),
        {
          'content-type': contentType,
        },
      ];
    });
  return axiosWithContentLimit(
    {
      method: 'get',
      url: exampleUrl,
    },
    1e6,
  );
};

describe('openGraph', () => {
  afterEach(() => nock.cleanAll());

  it('decodes a text encoded with UTF-8', async () => {
    const result = await doRequest('text/html; charset=utf-8', defaultMessageUtf8);
    assert.strictEqual(result, defaultMessage);
  });

  it('decodes a russian text encoded with koi8-r', async () => {
    const result = await doRequest('text/html; charset=koi8-r', russianMessageKoi8r);
    assert.strictEqual(result, russianMessage);
  });

  it('decodes a russian text encoded with UTF-8', async () => {
    const result = await doRequest('text/html; charset=utf-8', russianMessageUtf8);
    assert.strictEqual(result, russianMessage);
  });

  it('defaults to utf8 on invalid charsets', async () => {
    const result = await doRequest('text/html; charset=invalid', defaultMessageUtf8);
    assert.strictEqual(result, defaultMessage);
  });

  it('defaults to utf8 on missing charset', async () => {
    const result = await doRequest('text/html', defaultMessageUtf8);
    assert.strictEqual(result, defaultMessage);
  });

  it('throws on missing content type', async () => {
    try {
      await doRequest('', []);
    } catch (error) {
      assert.notStrictEqual(error.message, 'Could not parse content type');
    }
  });
});

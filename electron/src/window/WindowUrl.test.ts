/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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
import {WindowUrl} from './WindowUrl';

describe('WindowUrl', () => {
  describe('getUrlQueryString', () => {
    it('returns an unescaped string sequence containing the given parameters', () => {
      const params = new URLSearchParams({
        clientType: 'temporary',
        enableLogging: '@wireapp/*',
        hl: 'en',
      });
      const queryString = WindowUrl.getQueryString(params);
      const expectedString = '?clientType=temporary&enableLogging=@wireapp/*&hl=en';
      assert.strictEqual(queryString, expectedString);
    });
  });

  describe('replaceUrlParams', () => {
    it('replaces all query params in a given url string', () => {
      const params = new URLSearchParams({
        clientType: 'overwritten',
      });
      const url = 'https://app.wire.example.com/?clientType=temporary';
      const newUrl = WindowUrl.replaceQueryParams(url, params);
      const expectedUrl = encodeURIComponent('https://app.wire.example.com/?clientType=overwritten');
      assert.strictEqual(newUrl, expectedUrl);
    });
  });

  describe('createWebappUrl', () => {
    it('creates a custom environment webapp URL based on parameters from an existing renderer page', () => {
      const rendererPage =
        'file:///D:/dev/projects/wireapp/wire-desktop/electron/renderer/index.html?env=https%3A%2F%2Fwire-webapp-dev.zinfra.io%3Fhl%3Den%26enableLogging%3D%40wireapp%2F*';
      const customWebapp = 'https://webapp.qa-demo.wire.link?clienttype=permanent';
      const updatedWebapp = WindowUrl.createWebappUrl(rendererPage, customWebapp);
      const expectedUrl = encodeURIComponent(
        'https://webapp.qa-demo.wire.link?hl=en&enableLogging=@wireapp/*&clienttype=permanent',
      );
      assert.strictEqual(updatedWebapp, expectedUrl);
    });
  });
});

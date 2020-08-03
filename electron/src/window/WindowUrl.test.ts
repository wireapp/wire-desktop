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
  describe('createWebappUrl', () => {
    it('creates a custom environment WebApp URL based on parameters from an existing renderer page', () => {
      const rendererPage =
        'file:///D:/dev/projects/wireapp/wire-desktop/electron/renderer/index.html?env=https%3A%2F%2Fwire-webapp-dev.zinfra.io%3Fhl%3Den%26enableLogging%3D%40wireapp%2F*';
      const customWebApp = 'https://webapp.qa-demo.wire.link?clienttype=permanent';
      const updatedWebApp = WindowUrl.createWebAppUrl(rendererPage, customWebApp);
      const expectedUrl = 'https://webapp.qa-demo.wire.link/?clienttype=permanent&hl=en&enableLogging=%40wireapp%2F*';
      assert.strictEqual(updatedWebApp, expectedUrl);
    });

    it('throws an error if the environment includes an invalid URL', () => {
      const rendererPage = 'file:///D:/dev/projects/wireapp/wire-desktop/electron/renderer/index.html?env=undefined';
      const customWebApp = 'https://webapp.qa-demo.wire.link?clienttype=permanent';
      assert.throws(() => WindowUrl.createWebAppUrl(rendererPage, customWebApp));
    });
  });
});

import * as assert from 'assert';
import {WindowUrl} from './WindowUrl';

describe.only('WindowUrl', () => {
  describe('getUrlQueryString', () => {
    it('returns an unescaped string sequence containing the given parameters', () => {
      const params = {
        clientType: 'temporary',
        enableLogging: '@wireapp/*',
        hl: 'en',
      };
      const queryString = WindowUrl.getQueryString(params);
      const expectedString = '?clientType=temporary&enableLogging=@wireapp/*&hl=en';
      assert.strictEqual(queryString, expectedString);
    });
  });

  describe('replaceUrlParams', () => {
    it('replaces all query params in a given url string', () => {
      const params = {
        clientType: 'overwritten',
      };
      const url = 'https://app.wire.example.com/?clientType=temporary';
      const newUrl = WindowUrl.replaceQueryParams(url, params);
      const expectedUrl = encodeURIComponent('https://app.wire.example.com/?clientType=overwritten');
      assert.strictEqual(newUrl, expectedUrl);
    });
  });

  describe('createWebappUrl', () => {
    it('replaces the env parameter of a local file URL with a given URL and merges the parameters', () => {
      const localRendererUrl = `file:///D:/dev/projects/wireapp/wire-desktop/electron/renderer/index.html?env=${encodeURIComponent(
        'https://wire-webapp-dev.zinfra.io?clientType=permanent&hl=en&enableLogging=@wireapp/*',
      )}`;
      const customBackendUrl = 'https://app.wire.example.com/?clientType=temporary';
      const expectedURL = `file:///D:/dev/projects/wireapp/wire-desktop/electron/renderer/index.html?env=${encodeURIComponent(
        'https://app.wire.example.com/?clientType=temporary&hl=en&enableLogging=@wireapp/*',
      )}`;
      const actual = WindowUrl.createWebappUrl(localRendererUrl, customBackendUrl, true);
      assert.strictEqual(actual, expectedURL);
    });

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

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

import {app, BrowserWindow, session} from 'electron';
import {stub} from 'sinon';
import {Maybe} from 'true-myth';

import * as assert from 'assert';
import {createServer} from 'http';
import * as path from 'path';

import {SingleSignOn} from './SingleSignOn';

describe('SingleSignOn', () => {
  describe('shared passkey session', () => {
    const windows: BrowserWindow[] = [];
    const createWindow = (options: Electron.BrowserWindowConstructorOptions) => {
      const window = new BrowserWindow({...options, show: false});
      windows.push(window);
      return window;
    };

    afterEach(() => {
      windows
        .splice(0)
        .reverse()
        .forEach(window => {
          if (!window.isDestroyed()) {
            window.destroy();
          }
        });
    });

    it('releases a failed initialization so another login can open', async () => {
      const parent = createWindow({});
      const popup = createWindow(SingleSignOn.getSingleSignOnLoginWindowOptions(parent, 'https://idp.test'));
      const flow = new SingleSignOn(popup, parent.webContents, Maybe.nothing(), 'https://idp.test');
      let active: SingleSignOn | null = flow;
      const closed = new Promise<void>(resolve => {
        flow.onClose = () => {
          active = null;
          resolve();
        };
      });
      const clear = stub(popup.webContents.session, 'clearStorageData').rejects(new Error('storage unavailable'));
      try {
        await assert.rejects(flow.init(), /storage unavailable/);
        flow.close();
        await closed;
        assert.strictEqual(active, null);
      } finally {
        clear.restore();
      }
      const nextPopup = createWindow(SingleSignOn.getSingleSignOnLoginWindowOptions(parent, 'data:text/html,login'));
      const next = new SingleSignOn(nextPopup, parent.webContents, Maybe.nothing(), 'data:text/html,login');
      const nextClosed = new Promise<void>(resolve => {
        next.onClose = resolve;
      });
      await next.init();
      next.close();
      await nextClosed;
    });

    it('uses the same persistent SSO session for windows opened by separate accounts', async () => {
      const firstAccount = createWindow({webPreferences: {partition: 'sso-test-account-one'}});
      const secondAccount = createWindow({webPreferences: {partition: 'sso-test-account-two'}});
      const firstLogin = createWindow(SingleSignOn.getSingleSignOnLoginWindowOptions(firstAccount, 'https://idp.test'));
      const secondLogin = createWindow(
        SingleSignOn.getSingleSignOnLoginWindowOptions(secondAccount, 'https://idp.test'),
      );
      const shared = firstLogin.webContents.session;

      assert.strictEqual(shared, secondLogin.webContents.session);
      assert.notStrictEqual(shared, firstAccount.webContents.session);
      assert.notStrictEqual(shared, secondAccount.webContents.session);
      assert.notStrictEqual(shared, session.defaultSession);
      assert.strictEqual(shared.isPersistent(), true);

      await shared.cookies.set({url: 'https://idp.test', name: 'sso-test', value: 'present'});
      await firstAccount.webContents.session.clearStorageData();
      assert.strictEqual((await shared.cookies.get({name: 'sso-test'})).length, 1);
      await shared.clearStorageData();
    });

    it('clears IdP cookies without replacing the persistent SSO session', async () => {
      const parent = createWindow({});
      const login = createWindow(SingleSignOn.getSingleSignOnLoginWindowOptions(parent, 'https://idp.test'));
      const shared = login.webContents.session;
      const storagePath = shared.storagePath;
      await shared.cookies.set({url: 'https://idp.test', name: 'sso-test', value: 'present'});
      const flow = Object.create(SingleSignOn.prototype) as SingleSignOn;
      flow['session'] = shared;
      await flow['wipeSessionData']();

      assert.strictEqual((await shared.cookies.get({name: 'sso-test'})).length, 0);
      login.destroy();
      const nextLogin = createWindow(SingleSignOn.getSingleSignOnLoginWindowOptions(parent, 'https://idp.test'));
      assert.strictEqual(nextLogin.webContents.session, shared);
      assert.strictEqual(nextLogin.webContents.session.storagePath, storagePath);
    });

    it('completes independent SSO and preserves the account cookie after popup cleanup', async function () {
      this.timeout(15000);
      const server = createServer((_request, response) => {
        response.setHeader('Set-Cookie', 'zuid=test-login; Path=/access; HttpOnly; SameSite=Lax');
        response.end(`<script>window.opener.postMessage({type:'AUTH_SUCCESS'}, '*'); window.close();</script>`);
      });
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const port = (server.address() as {port: number}).port;
      const backend = `http://127.0.0.1:${port}/`;
      const appPath = stub(app, 'getAppPath').returns(path.resolve(__dirname, '../../..'));
      const parent = createWindow({webPreferences: {partition: 'independent-sso-account'}});
      const options = SingleSignOn.getSingleSignOnLoginWindowOptions(parent, backend);
      const popup = createWindow(options);
      const shared = popup.webContents.session;
      let result!: {origin: string; type: string};
      const send = stub(parent.webContents, 'send').callsFake((channel, value) => {
        if (channel === 'wire:sso-result') {
          result = value;
        }
      });
      const flow = new SingleSignOn(popup, parent.webContents, Maybe.nothing(), `${backend}/sso/initiate-login/test`);
      const closed = new Promise<void>(resolve => {
        flow.onClose = resolve;
      });
      try {
        assert.notStrictEqual(shared, parent.webContents.session);
        await flow.init();
        await closed;
        assert.deepStrictEqual(result, {origin: backend, type: 'AUTH_SUCCESS'});
        assert.strictEqual(
          (await parent.webContents.session.cookies.get({url: `${backend}access`, name: 'zuid'})).length,
          1,
        );
        assert.strictEqual((await shared.cookies.get({name: 'zuid'})).length, 0);
        // Removing the sub-app clears only its partition. A replacement sub-app's
        // SSO window still uses the same persistent authentication session.
        await parent.webContents.session.clearStorageData();
        const replacement = createWindow({webPreferences: {partition: 'replacement-sso-account'}});
        const next = createWindow(SingleSignOn.getSingleSignOnLoginWindowOptions(replacement, backend));
        assert.strictEqual(next.webContents.session, shared);
        assert.strictEqual(next.webContents.session.isPersistent(), true);
      } finally {
        send.restore();
        appPath.restore();
        flow.close();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });
  });

  describe('independent SSO callback validation', () => {
    it('preserves validated backend errors through the popup preload', async function () {
      this.timeout(15000);
      const server = createServer((_request, response) => response.end('<title>SSO</title>'));
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const backend = `http://127.0.0.1:${(server.address() as {port: number}).port}`;
      const appPath = stub(app, 'getAppPath').returns(path.resolve(__dirname, '../../..'));
      const parent = new BrowserWindow({show: false});
      const popup = new BrowserWindow(SingleSignOn.getSingleSignOnLoginWindowOptions(parent, backend));
      const send = stub(parent.webContents, 'send');
      const flow = new SingleSignOn(popup, parent.webContents, Maybe.nothing(), `${backend}/sso/initiate-login/test`);
      const closed = new Promise<void>(resolve => {
        flow.onClose = resolve;
      });
      try {
        await flow.init();
        assert.strictEqual(
          await popup.webContents.executeJavaScript(
            "__wireSsoOpener.postMessage({type:'AUTH_ERROR', payload:{label:'forbidden', errors:[42]}})",
          ),
          false,
        );
        await popup.webContents.executeJavaScript(
          "__wireSsoOpener.postMessage({type:'AUTH_ERROR', payload:{label:'forbidden', errors:['denied'], extra:'discard'}})",
        );
        assert.ok(
          send.calledOnceWithExactly('wire:sso-result', {
            origin: backend,
            type: 'AUTH_ERROR',
            payload: {label: 'forbidden', errors: ['denied']},
          }),
        );
      } finally {
        flow.close();
        await closed;
        parent.destroy();
        send.restore();
        appPath.restore();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });

    it('rejects other origins and invalid result types, and reports a missing login cookie', async function () {
      this.timeout(15000);
      const server = createServer((_request, response) => response.end('<title>SSO test</title>'));
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const backend = `http://127.0.0.1:${(server.address() as {port: number}).port}`;
      const appPath = stub(app, 'getAppPath').returns(path.resolve(__dirname, '../../..'));
      const parent = new BrowserWindow({show: false, webPreferences: {partition: 'callback-test-account'}});
      const options = SingleSignOn.getSingleSignOnLoginWindowOptions(parent, backend);
      const popup = new BrowserWindow(options);
      const send = stub(parent.webContents, 'send');
      const flow = new SingleSignOn(popup, parent.webContents, Maybe.nothing(), `${backend}/sso/initiate-login/test`);
      const closed = new Promise<void>(resolve => {
        flow.onClose = resolve;
      });
      try {
        await flow.init();
        assert.strictEqual(
          await popup.webContents.executeJavaScript("__wireSsoOpener.postMessage({type:'INVALID'})"),
          false,
        );
        await popup.loadURL('data:text/html,<title>Other origin</title>');
        assert.strictEqual(
          await popup.webContents.executeJavaScript("__wireSsoOpener.postMessage({type:'AUTH_SUCCESS'})"),
          false,
        );
        assert.strictEqual(send.called, false);
        await popup.loadURL(`${backend}/sso/initiate-login/test`);
        await popup.webContents.executeJavaScript("__wireSsoOpener.postMessage({type:'AUTH_SUCCESS'})");
        assert.strictEqual(
          send.calledOnceWithExactly('wire:sso-result', {origin: backend, type: 'AUTH_ERROR_COOKIE'}),
          true,
        );
        flow.close();
        await closed;
      } finally {
        flow.close();
        parent.destroy();
        send.restore();
        appPath.restore();
        await new Promise<void>(resolve => server.close(() => resolve()));
      }
    });
  });

  describe('SSO cookie handoff', () => {
    const source = () => session.fromPartition('sso-cookie-test-source');
    const target = () => session.fromPartition('sso-cookie-test-target');
    const backend = new URL('https://backend.test/sso/initiate-login/test');

    afterEach(async () => {
      await source().clearStorageData();
      await target().clearStorageData();
    });

    it('copies the backend login cookie before SSO cleanup, without copying IdP or other backend cookies', async () => {
      await source().cookies.set({
        url: 'https://backend.test/access',
        name: 'zuid',
        value: 'test-login',
        path: '/access',
        secure: true,
        httpOnly: true,
      });
      await source().cookies.set({url: 'https://other.test', name: 'zuid', value: 'other-login', secure: true});
      await source().cookies.set({
        url: 'https://backend.test',
        name: 'KEYCLOAK_SESSION',
        value: 'idp-login',
        secure: true,
      });

      await SingleSignOn['copyCookies'](source(), target(), backend);
      await source().clearStorageData();
      const cookies = await target().cookies.get({url: 'https://backend.test/access'});
      assert.strictEqual(cookies.length, 1);
      assert.strictEqual(cookies[0].name, 'zuid');
      assert.strictEqual(cookies[0].value, 'test-login');
      assert.strictEqual(cookies[0].httpOnly, true);
      assert.strictEqual(cookies[0].hostOnly, true);
      assert.strictEqual((await target().cookies.get({url: 'https://child.backend.test/access'})).length, 0);
      assert.strictEqual((await target().cookies.get({url: 'https://other.test'})).length, 0);
    });

    it('rejects success without a cookie for the requesting backend', async () => {
      await source().cookies.set({url: 'https://other.test', name: 'zuid', value: 'other-login', secure: true});
      await assert.rejects(
        SingleSignOn['copyCookies'](source(), target(), backend),
        /without a Wire authentication cookie/,
      );
    });
  });
});

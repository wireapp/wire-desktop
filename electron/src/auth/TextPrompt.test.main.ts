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

import {app, BrowserWindow} from 'electron';
import {stub} from 'sinon';

import * as assert from 'assert';
import {createServer, Server} from 'http';
import path from 'path';

import {registerTextPrompt} from './TextPrompt';

const root = path.resolve(__dirname, '../../..');
const waitFor = async <T>(get: () => T | undefined): Promise<T> => {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const value = get();
    if (value) {
      return value;
    }
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('Timed out waiting for text prompt');
};

describe('SSO website text prompt', function () {
  this.timeout(15000);
  let server: Server;
  let origin: string;
  let parent: BrowserWindow;
  let appPath: ReturnType<typeof stub>;

  before(async () => {
    appPath = stub(app, 'getAppPath').returns(root);
    server = createServer((_request, response) => response.end('<!doctype html><title>Test IdP</title>'));
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as {port: number};
    origin = `http://127.0.0.1:${address.port}`;
  });
  after(async () => {
    appPath.restore();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(async () => {
    parent = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        preload: path.join(root, 'electron/dist/preload/preload-sso.js'),
      },
    });
    registerTextPrompt(parent);
    await parent.loadURL(origin);
  });
  afterEach(() => {
    if (!parent.isDestroyed()) {
      parent.destroy();
    }
  });

  const dialog = async (): Promise<BrowserWindow> => {
    const win = await waitFor(() =>
      BrowserWindow.getAllWindows().find(win => win.webContents.getURL().endsWith('/html/text-prompt.html')),
    );
    await waitFor(() => (!win.webContents.isLoading() ? win : undefined));
    // The preload populates the form asynchronously via a scoped IPC handler.
    await waitFor(asyncReady(win));
    return win;
  };
  const asyncReady = (win: BrowserWindow): (() => BrowserWindow | undefined) => {
    let ready = false;
    void win.webContents
      .executeJavaScript(
        `new Promise(resolve => {
      const timer = setInterval(() => {
        if (document.querySelector('#origin').textContent) { clearInterval(timer); resolve(true); }
      }, 10);
    })`,
      )
      .then(() => {
        ready = true;
      });
    return () => (ready ? win : undefined);
  };

  it('returns user text synchronously to any IdP, preserving the default and displaying its origin', async () => {
    const result = parent.webContents.executeJavaScript(`prompt('Name <b>passkey</b>', 'Default label')`);
    const win = await dialog();
    const values = await win.webContents.executeJavaScript(`({origin: document.querySelector('#origin').textContent,
      message: document.querySelector('#message').textContent, value: document.querySelector('#value').value,
      markup: document.querySelector('#message b') !== null})`);
    assert.deepStrictEqual(values, {origin, message: 'Name <b>passkey</b>', value: 'Default label', markup: false});
    await win.webContents.executeJavaScript(
      `document.querySelector('#value').value = 'My Mac'; document.querySelector('form').requestSubmit()`,
    );
    assert.strictEqual(await result, 'My Mac');
  });

  for (const action of ['cancel', 'escape', 'close', 'empty']) {
    it(`handles ${action} with browser prompt semantics`, async () => {
      const result = parent.webContents.executeJavaScript(`prompt('Label', 'Initial')`);
      const win = await dialog();
      if (action === 'close') {
        win.close();
      } else {
        const script =
          action === 'cancel'
            ? `document.querySelector('#cancel').click()`
            : action === 'escape'
            ? `window.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))`
            : `document.querySelector('#value').value = ''; document.querySelector('form').requestSubmit()`;
        await win.webContents.executeJavaScript(script);
      }
      assert.strictEqual(await result, action === 'empty' ? '' : null);
    });
  }

  it('rejects oversized requests without opening a dialog', async () => {
    assert.strictEqual(await parent.webContents.executeJavaScript(`prompt('x'.repeat(4097), '')`), null);
    assert.strictEqual(BrowserWindow.getAllWindows().filter(win => win !== parent).length, 0);
  });

  it('closes the dialog when the requesting window is destroyed', async () => {
    // executeJavaScript cannot return from a renderer that has been destroyed.
    void parent.webContents.executeJavaScript(`prompt('Label')`).catch(() => null);
    const win = await dialog();
    parent.destroy();
    await waitFor(() => (win.isDestroyed() ? true : undefined));
    assert.ok(win.isDestroyed());
  });

  it('cancels an open prompt when the requesting page navigates', async () => {
    const result = parent.webContents.executeJavaScript(`prompt('Label')`).catch(() => null);
    const win = await dialog();
    await parent.loadURL(`${origin}/redirected`);
    assert.ok(win.isDestroyed());
    assert.strictEqual(await result, null);
  });

  it('supports prompts after an IdP redirect', async () => {
    await parent.loadURL(`${origin}/another-provider`);
    const result = parent.webContents.executeJavaScript(`prompt('Second provider')`);
    const win = await dialog();
    await win.webContents.executeJavaScript(`document.querySelector('#cancel').click()`);
    assert.strictEqual(await result, null);
  });
});

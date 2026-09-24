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

import {BrowserWindow, dialog, Session, webContents, WebFrameMain} from 'electron';
import {restore, spy, stub, SinonStub} from 'sinon';

import * as assert from 'assert';
import {EventEmitter} from 'events';

import {registerWebAuthnAccountPicker} from './WebAuthn';

describe('WebAuthn account picker', () => {
  let session: EventEmitter;
  let showDialog: SinonStub;
  let frame: {detached: boolean; url: string};

  const accounts = [
    {credentialId: 'first', displayName: 'Alice', name: 'alice@example.com'},
    {credentialId: 'second', displayName: 'Bob', name: 'bob@example.com'},
  ];

  beforeEach(() => {
    session = new EventEmitter();
    frame = {detached: false, url: 'https://example.com/login'};
    stub(webContents, 'fromFrame').returns({isDestroyed: () => false} as Electron.WebContents);
    stub(BrowserWindow, 'fromWebContents').returns({isDestroyed: () => false} as BrowserWindow);
    showDialog = stub(dialog, 'showMessageBox').resolves({response: 1, checkboxChecked: false});
    registerWebAuthnAccountPicker(session as unknown as Session);
  });

  afterEach(() => restore());

  async function selectAccount(requestFrame: WebFrameMain | null = frame as WebFrameMain) {
    const callback = spy();
    await session.listeners('select-webauthn-account')[0](
      {},
      {frame: requestFrame, relyingPartyId: 'example.com', accounts},
      callback,
    );
    assert.strictEqual(callback.callCount, 1);
    return callback.firstCall.args[0];
  }

  it('registers once per session while covering separate partitions', () => {
    registerWebAuthnAccountPicker(session as unknown as Session);
    const otherSession = new EventEmitter();
    registerWebAuthnAccountPicker(otherSession as unknown as Session);
    assert.strictEqual(session.listenerCount('select-webauthn-account'), 1);
    assert.strictEqual(otherSession.listenerCount('select-webauthn-account'), 1);
  });

  it('returns the selected credential and displays the relying party and accounts', async () => {
    assert.strictEqual(await selectAccount(), 'second');
    const options = showDialog.firstCall.args[1];
    assert.strictEqual(options.message, 'Choose an account for example.com');
    assert.deepStrictEqual(options.buttons.slice(0, 2), ['Alice — alice@example.com', 'Bob — bob@example.com']);
    assert.strictEqual(options.cancelId, 2);
    assert.strictEqual(options.defaultId, 2);
  });

  it('cancels when the user dismisses the picker', async () => {
    showDialog.resolves({response: 2});
    assert.strictEqual(await selectAccount(), undefined);
  });

  it('cancels when the requesting frame no longer exists', async () => {
    assert.strictEqual(await selectAccount(null), undefined);
    assert.ok(showDialog.notCalled);
  });

  it('cancels when the frame navigates while the picker is open', async () => {
    showDialog.callsFake(async () => {
      frame.url = 'https://example.com/other';
      return {response: 0};
    });
    assert.strictEqual(await selectAccount(), undefined);
  });

  it('cancels when the frame is detached while the picker is open', async () => {
    showDialog.callsFake(async () => {
      frame.detached = true;
      return {response: 0};
    });
    assert.strictEqual(await selectAccount(), undefined);
  });

  it('cancels exactly once when the dialog fails', async () => {
    showDialog.rejects(new Error('Dialog unavailable'));
    assert.strictEqual(await selectAccount(), undefined);
  });
});

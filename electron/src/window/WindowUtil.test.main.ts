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

import {dialog, shell} from 'electron';
import * as assert from 'assert';
import * as sinon from 'sinon';

import * as WindowUtil from './WindowUtil';

describe('WindowUtil', () => {
  describe('openExternal', () => {
    let dialogStub: sinon.SinonStub;
    let shellStub: sinon.SinonStub;

    beforeEach(() => {
      shellStub = sinon.stub(shell, 'openExternal').returns(Promise.resolve());
      dialogStub = sinon.stub(dialog, 'showMessageBoxSync').returns(0);
    });

    afterEach(() => {
      dialogStub.restore();
      shellStub.restore();
    });

    it('opens secure URLs externally', async () => {
      const url = 'https://github.com/wireapp/wire-desktop';
      await WindowUtil.openExternal(url);

      assert.ok(shellStub.firstCall.calledWith(url));
      assert.ok(dialogStub.notCalled);
    });

    it('opens insecure URLs externally if allowed', async () => {
      const url = 'http://github.com/wireapp/wire-desktop';
      await WindowUtil.openExternal(url, false);

      assert.ok(shellStub.firstCall.calledWith(url));
      assert.ok(dialogStub.notCalled);
    });

    it(`doesn't open insecure URLs externally if not allowed`, async () => {
      const url = 'http://example.org';
      await WindowUtil.openExternal(url, true);

      assert.ok(shellStub.notCalled);
      assert.ok(dialogStub.called);
    });

    it(`doesn't open non-website URLs externally`, async () => {
      const url = 'smb://attacker.tld/public/pwn.desktop';
      await WindowUtil.openExternal(url);

      assert.ok(shellStub.notCalled);
      assert.ok(dialogStub.called);
    });
  });
});

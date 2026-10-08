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

import {spy, replace, restore} from 'sinon';

import * as assert from 'assert';

import {CustomProtocolHandler} from './CoreProtocol';
import {EVENT_TYPE} from './eventType';
import * as dialogs from './showDialog';

let protocolHandler: CustomProtocolHandler;

describe('dispatchDeepLink', () => {
  const sendActionSpy = spy();

  beforeEach(() => {
    protocolHandler = new CustomProtocolHandler();
    replace(protocolHandler['windowManager'], 'sendActionToPrimaryWindow', sendActionSpy);
    replace(protocolHandler['windowManager'], 'sendActionAndFocusWindow', sendActionSpy);
  });

  afterEach(() => restore());

  it('forwards conversation deep links to the WebApp', async () => {
    await protocolHandler['dispatchDeepLink']('wire://conversation/8cdb44a0-418b-4188-9a53-7c477a7848dd');
    assert.ok(
      sendActionSpy.calledWith(
        EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH,
        '/conversation/8cdb44a0-418b-4188-9a53-7c477a7848dd',
      ),
    );
  });

  it('forwards user profile deep links to the WebApp', async () => {
    await protocolHandler['dispatchDeepLink']('wire://user/266d36c0-ae62-48b5-91b5-b10ed42f1a0f');
    assert.ok(
      sendActionSpy.calledWith(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, '/user/266d36c0-ae62-48b5-91b5-b10ed42f1a0f'),
    );
  });

  it('forwards SSO logins', async () => {
    await protocolHandler['dispatchDeepLink']('wire://start-sso/wire-13266298-4ac8-44b5-8281-dfb9e95fab5c');
    assert.ok(sendActionSpy.calledWith(EVENT_TYPE.ACCOUNT.SSO_LOGIN, 'wire-13266298-4ac8-44b5-8281-dfb9e95fab5c'));
  });

  it('does not forward system authentication cookie callbacks to the renderer', async () => {
    sendActionSpy.resetHistory();
    await protocolHandler['dispatchDeepLink']('wire://login/success?cookie=zuid%3Dsecret&validation_token=state');
    assert.strictEqual(sendActionSpy.called, false);
    assert.strictEqual(protocolHandler.hashLocation, '');
  });

  it('silently ignores oversized system callbacks while rejecting oversized ordinary links', async () => {
    sendActionSpy.resetHistory();
    const errorDialog = spy();
    replace(dialogs, 'showErrorDialog', errorDialog);
    await protocolHandler['dispatchDeepLink'](`wire://login/success?cookie=${'x'.repeat(16000)}`);
    assert.strictEqual(errorDialog.called, false);
    assert.strictEqual(sendActionSpy.called, false);
    assert.strictEqual(protocolHandler.hashLocation, '');
    await protocolHandler['dispatchDeepLink'](`wire://conversation/${'x'.repeat(1100)}`);
    assert.strictEqual(errorDialog.calledOnce, true);
  });

  it('forwards start login events', async () => {
    await protocolHandler['dispatchDeepLink']('wire://start-login');
    assert.ok(sendActionSpy.calledWith(EVENT_TYPE.ACTION.START_LOGIN));
  });
});

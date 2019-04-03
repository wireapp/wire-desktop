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
import sinon from 'sinon';
import {CustomProtocolHandler} from './CoreProtocol';
import {EVENT_TYPE} from './eventType';

let protocolHandler: CustomProtocolHandler = undefined;

describe('dispatcher', () => {
  const sendActionSpy: sinon.SinonSpy = sinon.spy();

  beforeEach(() => {
    protocolHandler = new CustomProtocolHandler();
    sinon.replace(protocolHandler['windowManager'], 'sendActionToPrimaryWindow', sendActionSpy);
    sinon.replace(protocolHandler['windowManager'], 'sendActionAndFocusWindow', sendActionSpy);
  });

  afterEach(() => sinon.restore());

  it('forwards conversation deep links to the webapp', async () => {
    await protocolHandler.dispatchDeepLink('wire://conversation/8cdb44a0-418b-4188-9a53-7c477a7848dd');
    assert.ok(
      sendActionSpy.calledWith(
        EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH,
        '/conversation/8cdb44a0-418b-4188-9a53-7c477a7848dd'
      )
    );
  });

  it('forwards user profile deep links to the webapp', async () => {
    await protocolHandler.dispatchDeepLink('wire://user/266d36c0-ae62-48b5-91b5-b10ed42f1a0f');
    assert.ok(
      sendActionSpy.calledWith(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, '/user/266d36c0-ae62-48b5-91b5-b10ed42f1a0f')
    );
  });

  it('forwards SSO logins', async () => {
    await protocolHandler.dispatchDeepLink('wire://start-sso/wire-13266298-4ac8-44b5-8281-dfb9e95fab5c');
    assert.ok(sendActionSpy.calledWith(EVENT_TYPE.ACCOUNT.SSO_LOGIN, 'wire-13266298-4ac8-44b5-8281-dfb9e95fab5c'));
  });
});

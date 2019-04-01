import * as assert from 'assert';
import sinon from 'sinon';
import {CustomProtocolHandler} from './CoreProtocol';
import {EVENT_TYPE} from "./eventType";

let protocolHandler: CustomProtocolHandler = undefined;

describe('dispatcher', () => {
  let sendActionSpy: sinon.SinonSpy = sinon.spy();

  beforeEach(() => {
    protocolHandler = new CustomProtocolHandler();
    sinon.replace(protocolHandler['windowManager'], 'sendActionToPrimaryWindow', sendActionSpy);
    sinon.replace(protocolHandler['windowManager'], 'sendActionAndFocusWindow', sendActionSpy);
  });

  afterEach(() => sinon.restore());

  it('forwards conversation deep links to the webapp', () => {
    protocolHandler.dispatcher('wire://conversation/8cdb44a0-418b-4188-9a53-7c477a7848dd');
    assert.ok(sendActionSpy.calledWith(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, '/conversation/8cdb44a0-418b-4188-9a53-7c477a7848dd'));
  });

  it('forwards user profile deep links to the webapp', () => {
    protocolHandler.dispatcher('wire://user/266d36c0-ae62-48b5-91b5-b10ed42f1a0f');
    assert.ok(sendActionSpy.calledWith(EVENT_TYPE.WEBAPP.CHANGE_LOCATION_HASH, '/user/266d36c0-ae62-48b5-91b5-b10ed42f1a0f'));
  });

  it('forwards SSO logins', () => {
    protocolHandler.dispatcher('wire://start-sso/wire-13266298-4ac8-44b5-8281-dfb9e95fab5c');
    assert.ok(sendActionSpy.calledWith(EVENT_TYPE.ACCOUNT.SSO_LOGIN, 'wire-13266298-4ac8-44b5-8281-dfb9e95fab5c'));
  });
});

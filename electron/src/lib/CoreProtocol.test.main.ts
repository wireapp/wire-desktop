import * as assert from 'assert';
import sinon from 'sinon';
import {CustomProtocolHandler} from './CoreProtocol';

let protocolHandler: CustomProtocolHandler = undefined;

describe('dispatcher', () => {
  beforeEach(() => {
    protocolHandler = new CustomProtocolHandler();
  });

  it('forwards conversation deep links to the webapp', () => {
    sinon.replace(protocolHandler, 'forwardHashLocation', sinon.fake());
    protocolHandler.dispatcher('wire://conversation/8cdb44a0-418b-4188-9a53-7c477a7848dd');
    assert.strictEqual((protocolHandler['forwardHashLocation'] as sinon.SinonSpy).calledOnce, true);
  });

  it('forwards user profile deep links to the webapp', () => {
    sinon.replace(protocolHandler, 'forwardHashLocation', sinon.fake());
    protocolHandler.dispatcher('wire://user/266d36c0-ae62-48b5-91b5-b10ed42f1a0f');
    assert.strictEqual((protocolHandler['forwardHashLocation'] as sinon.SinonSpy).calledOnce, true);
  });

  it('forwards SSO logins', () => {
    sinon.replace(protocolHandler, 'handleSSOLogin', sinon.fake());
    protocolHandler.dispatcher('wire://start-sso/wire-13266298-4ac8-44b5-8281-dfb9e95fab5c');
    assert.strictEqual((protocolHandler['handleSSOLogin'] as sinon.SinonSpy).calledOnce, true);
  });
});

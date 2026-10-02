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

import type {BrowserWindow, WebContents} from 'electron';

import * as assert from 'assert';
import {EventEmitter} from 'events';

import {BrowserSingleSignOn} from './BrowserSingleSignOn';

const loginUrl = 'https://backend.example/sso/initiate-login/11111111-1111-1111-1111-111111111111';

function setup(failCookie = false) {
  const events: string[] = [];
  let callback: (value: string) => void = () => {};
  let callbackUrl = '';
  let scheme = '';
  const parent = Object.assign(new EventEmitter(), {isDestroyed: () => false, focus: () => {}});
  const sender = Object.assign(new EventEmitter(), {
    isDestroyed: () => false,
    send: (_channel: string, result: {type: string}) => events.push(result.type),
    session: {
      cookies: {
        set: async () => {
          events.push('set');
          if (failCookie) {
            throw new Error('secret cookie error');
          }
        },
        flushStore: async () => {
          events.push('flush');
        },
        remove: async () => {
          events.push('remove');
        },
      },
    },
  });
  const flow = new BrowserSingleSignOn(
    parent as unknown as BrowserWindow,
    sender as unknown as WebContents,
    loginUrl,
    (_parent, url, callbackScheme) => {
      callbackUrl = new URL(url).searchParams.get('success_redirect')!;
      scheme = callbackScheme;
      return {
        result: new Promise<string>(resolve => {
          callback = resolve;
        }),
        cancel: () => {
          events.push('cancel');
        },
      };
    },
  );
  flow.onClose = () => {
    events.push('close');
  };
  const complete = (wrongState = false) => {
    const url = new URL(callbackUrl);
    url.searchParams.set('cookie', 'zuid=secret; Path=/access; HttpOnly; Secure');
    url.searchParams.set('userid', '11111111-1111-1111-1111-111111111111');
    if (wrongState) {
      url.searchParams.set('validation_token', 'wrong');
    }
    assert.strictEqual(url.protocol, `${scheme}:`);
    callback(url.toString());
  };
  return {flow, complete, events, sender};
}

describe('browser SSO lifecycle', () => {
  it('flushes the account cookie before reporting success and closes once', async () => {
    const {flow, complete, events} = setup();
    const pending = flow.init();
    complete();
    await pending;
    flow.close();
    assert.deepStrictEqual(events, ['set', 'flush', 'AUTH_SUCCESS', 'cancel', 'close']);
  });

  it('does not write cookies for an uncorrelated callback', async () => {
    const {flow, complete, events} = setup();
    const pending = flow.init();
    complete(true);
    await pending;
    assert.deepStrictEqual(events, ['AUTH_ERROR', 'cancel', 'close']);
  });

  it('does not report success if cookie installation fails', async () => {
    const {flow, complete, events} = setup(true);
    const pending = flow.init();
    complete();
    await pending;
    assert.ok(events.includes('AUTH_ERROR'));
    assert.ok(!events.includes('AUTH_SUCCESS'));
  });

  it('removes a newly installed cookie if persistence fails', async () => {
    const {flow, complete, events, sender} = setup();
    sender.session.cookies.flushStore = async () => {
      throw new Error('persistence failure');
    };
    const pending = flow.init();
    complete();
    await pending;
    assert.deepStrictEqual(events, ['set', 'remove', 'AUTH_ERROR', 'cancel', 'close']);
  });

  it('ignores late callbacks after account removal or navigation', async () => {
    for (const event of ['destroyed', 'did-start-navigation']) {
      const {flow, complete, events, sender} = setup();
      const pending = flow.init();
      sender.emit(event, {}, 'https://other.example', false, true);
      complete();
      await pending;
      assert.deepStrictEqual(events, ['cancel', 'close']);
    }
  });

  it('removes an in-flight cookie and delays releasing the flow when cancelled during installation', async () => {
    const {flow, complete, events, sender} = setup();
    let finishSet: () => void = () => {};
    sender.session.cookies.set = () =>
      new Promise<void>(resolve => {
        finishSet = resolve;
      });
    const pending = flow.init();
    complete();
    await Promise.resolve();
    flow.close();
    assert.ok(!events.includes('close'));
    finishSet();
    await pending;
    assert.ok(events.includes('remove'));
    assert.ok(!events.includes('AUTH_SUCCESS'));
    assert.strictEqual(events.filter(event => event === 'close').length, 1);
  });
});

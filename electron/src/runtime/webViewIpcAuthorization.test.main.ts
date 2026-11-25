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

import {Maybe} from 'true-myth';

import * as assert from 'assert';

import {createAccountRemovalCoordinator} from './accountRemovalCoordinator';
import {createWebViewIpcAuthorization, RegisteredWebViewContext, WebViewIpcEvent} from './webViewIpcAuthorization';

const allowedOrigin = 'https://app.example.com';
const wrapper = {};
const accountId = '11111111-1111-4111-8111-111111111111';
const otherAccountId = '22222222-2222-4222-8222-222222222222';

type TestSender = WebViewIpcEvent['sender'];

type CreateSenderOptions = {
  readonly id: number;
  readonly hostWebContents?: object | null;
  readonly url?: string;
};

type CreateContextOptions = {
  readonly contents: TestSender;
  readonly accessRevoked?: boolean;
  readonly pendingOrigin?: string;
  readonly accountId?: string;
};

function createSender({id, hostWebContents = wrapper, url = allowedOrigin}: CreateSenderOptions): TestSender {
  const mainFrame = {url};
  return {
    id,
    mainFrame,
    hostWebContents,
    isDestroyed() {
      return false;
    },
  };
}

function createContext({
  contents,
  accessRevoked = false,
  pendingOrigin,
  accountId: authorizedAccountId = accountId,
}: CreateContextOptions): RegisteredWebViewContext {
  return {
    accountId: authorizedAccountId,
    contents,
    accountAccessRevoked: accessRevoked,
    pendingOrigin: Maybe.of(pendingOrigin),
    trustedOrigin: Maybe.just(allowedOrigin),
  };
}

describe('WebView IPC authorization', () => {
  it('requires the current registered guest, wrapper, main frame, and trusted or pending origin', () => {
    const guest = createSender({id: 1});
    const pendingOrigin = 'https://pending.example.com';
    const pendingGuest = createSender({id: 4, url: pendingOrigin});
    const destroyedGuest = {...createSender({id: 5}), isDestroyed: () => true};
    const foreignHost = createSender({id: 3, hostWebContents: {}});
    const untrustedGuest = createSender({id: 2, url: 'https://untrusted.example.com'});
    const contexts = new Map<number, RegisteredWebViewContext>([
      [guest.id, createContext({contents: guest})],
      [pendingGuest.id, createContext({contents: pendingGuest, pendingOrigin})],
      [destroyedGuest.id, createContext({contents: destroyedGuest})],
      [foreignHost.id, createContext({contents: foreignHost})],
      [untrustedGuest.id, createContext({contents: untrustedGuest})],
    ]);
    const authorization = createWebViewIpcAuthorization({
      getRegisteredWebViewContext(senderId) {
        return Maybe.of(contexts.get(senderId));
      },
      getWrapperWebContents() {
        return Maybe.just(wrapper);
      },
      isAccountRemovalInProgress() {
        return false;
      },
    });
    const authorizedEvent: WebViewIpcEvent = {sender: guest, senderFrame: guest.mainFrame};
    const pendingOriginEvent: WebViewIpcEvent = {sender: pendingGuest, senderFrame: pendingGuest.mainFrame};
    const foreignGuest = createSender({id: guest.id});
    const foreignFrame = {url: allowedOrigin};
    const unauthorizedEvents: WebViewIpcEvent[] = [
      {sender: foreignGuest, senderFrame: foreignGuest.mainFrame},
      {sender: guest, senderFrame: null},
      {sender: guest, senderFrame: foreignFrame},
      {sender: foreignHost, senderFrame: foreignHost.mainFrame},
      {sender: untrustedGuest, senderFrame: untrustedGuest.mainFrame},
      {sender: destroyedGuest, senderFrame: destroyedGuest.mainFrame},
    ];

    assert.strictEqual(authorization.authorizeWebView(authorizedEvent).isJust, true);
    assert.strictEqual(authorization.authorizeWebView(pendingOriginEvent).isJust, true);
    for (const unauthorizedEvent of unauthorizedEvents) {
      assert.strictEqual(authorization.authorizeWebView(unauthorizedEvent).isNothing, true);
    }

    contexts.set(guest.id, createContext({contents: guest, accessRevoked: true}));
    assert.strictEqual(authorization.authorizeWebView(authorizedEvent).isNothing, true);
  });

  it('blocks replacement guests during removal, then allows them after a failed removal settles', async () => {
    const coordinator = createAccountRemovalCoordinator();
    const firstGuest = createSender({id: 1});
    const replacementGuest = createSender({id: 2});
    const otherAccountGuest = createSender({id: 6});
    const contexts = new Map<number, RegisteredWebViewContext>([
      [firstGuest.id, createContext({contents: firstGuest})],
      [otherAccountGuest.id, createContext({contents: otherAccountGuest, accountId: otherAccountId})],
    ]);
    const authorization = createWebViewIpcAuthorization({
      getRegisteredWebViewContext(senderId) {
        return Maybe.of(contexts.get(senderId));
      },
      getWrapperWebContents() {
        return Maybe.just(wrapper);
      },
      isAccountRemovalInProgress: coordinator.isAccountRemovalInProgress,
    });
    const firstEvent = {sender: firstGuest, senderFrame: firstGuest.mainFrame};
    const replacementEvent = {sender: replacementGuest, senderFrame: replacementGuest.mainFrame};
    const otherAccountEvent = {sender: otherAccountGuest, senderFrame: otherAccountGuest.mainFrame};
    const removalCompletion = Promise.withResolvers<void>();
    const removal = coordinator.runAccountRemoval(accountId, async () => {
      await removalCompletion.promise;
      throw new Error('Removal failed before trusted-origin cleanup');
    });
    contexts.set(replacementGuest.id, createContext({contents: replacementGuest}));

    assert.strictEqual(authorization.authorizeWebView(firstEvent).isNothing, true);
    assert.strictEqual(authorization.authorizeWebView(replacementEvent).isNothing, true);
    assert.strictEqual(authorization.authorizeWebView(otherAccountEvent).isJust, true);

    contexts.set(firstGuest.id, createContext({contents: firstGuest, accessRevoked: true}));
    removalCompletion.resolve();
    await assert.rejects(removal, /Removal failed before trusted-origin cleanup/);

    assert.strictEqual(authorization.authorizeWebView(firstEvent).isNothing, true);
    assert.strictEqual(authorization.authorizeWebView(replacementEvent).isJust, true);
    assert.strictEqual(authorization.authorizeWebView(otherAccountEvent).isJust, true);
  });
});

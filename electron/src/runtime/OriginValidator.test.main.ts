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

import * as OriginValidator from './OriginValidator';
import type {NavigationEvent} from './OriginValidator';
import {
  createWebviewNavigationQueue,
  navigateWebviewDestination,
  registerNavigationEventHandlers,
  type NavigationDecision,
} from './WebviewNavigation';

function createNavigationEvent(wasPrevented: {value: boolean}): NavigationEvent {
  return {
    preventDefault() {
      wasPrevented.value = true;
    },
  };
}

describe('OriginValidator', () => {
  describe('isMatchingOrigin', () => {
    it('allows same-origin paths, query parameters, and fragments', () => {
      const actual = OriginValidator.isMatchingOrigin(
        'https://app.example.test/conversations/123?view=all#message',
        Maybe.just('https://app.example.test'),
      );

      assert.strictEqual(actual, true);
    });

    const disallowedUrls = [
      ['different domain', 'https://attacker.example.test/'],
      ['different subdomain', 'https://login.app.example.test/'],
      ['different port', 'https://app.example.test:8443/'],
      ['HTTPS downgrade', 'http://app.example.test/'],
      ['lookalike hostname', 'https://app.example.test.attacker.invalid/'],
      ['misleading userinfo', 'https://app.example.test@attacker.invalid/'],
      ['userinfo for trusted host', 'https://attacker@app.example.test/'],
      ['JavaScript URL', 'javascript:alert(1)'],
      ['data URL', 'data:text/html,unsafe'],
      ['blob URL', 'blob:https://app.example.test/1234'],
      ['about URL', 'about:blank'],
      ['file URL', 'file:///tmp/unsafe.html'],
      ['FTP URL', 'ftp://app.example.test/'],
      ['invalid URL', 'https://[invalid'],
    ] as const;

    for (const [description, destinationUrl] of disallowedUrls) {
      it(`rejects ${description}`, () => {
        const actual = OriginValidator.isMatchingOrigin(destinationUrl, Maybe.just('https://app.example.test'));

        assert.strictEqual(actual, false);
      });
    }

    it('supports custom self-hosted origins and ports', () => {
      const actual = OriginValidator.isMatchingOrigin(
        'https://chat.customer.example:9443/path',
        Maybe.just('https://chat.customer.example:9443'),
      );

      assert.strictEqual(actual, true);
    });

    it('supports explicitly configured local HTTP development origins', () => {
      const actual = OriginValidator.isMatchingOrigin(
        'http://localhost:8081/path',
        Maybe.just('http://localhost:8081'),
      );

      assert.strictEqual(actual, true);
    });

    it('rejects navigation when trusted-origin configuration is missing or invalid', () => {
      const missingConfiguration = OriginValidator.isMatchingOrigin(
        'https://app.example.test',
        Maybe.nothing<string>(),
      );
      const invalidConfiguration = OriginValidator.isMatchingOrigin(
        'https://app.example.test',
        Maybe.just('not a URL'),
      );

      assert.strictEqual(missingConfiguration, false);
      assert.strictEqual(invalidConfiguration, false);
    });
  });

  describe('trusted origins per account', () => {
    it('reads only valid, canonical HTTP origins from desktop configuration', () => {
      const trustedOrigins = OriginValidator.parseTrustedOrigins({
        'account-a': 'https://app.example.test',
        'account-b': 'https://self-hosted.example.test/path',
        'account-c': 'javascript:alert(1)',
        'account-d': 42,
      });

      assert.deepStrictEqual(trustedOrigins, {'account-a': 'https://app.example.test'});
    });

    it('keeps account origins independent', () => {
      const trustedOrigins = OriginValidator.parseTrustedOrigins({
        'account-a': 'https://app.example.test',
        'account-b': 'https://self-hosted.example.test',
      });
      const accountAOrigin = OriginValidator.getTrustedOriginForAccount({
        accountId: 'account-a',
        trustedOrigins,
      });
      const accountBOrigin = OriginValidator.getTrustedOriginForAccount({
        accountId: 'account-b',
        trustedOrigins,
      });

      assert.strictEqual(accountAOrigin.unwrapOr('missing'), 'https://app.example.test');
      assert.strictEqual(accountBOrigin.unwrapOr('missing'), 'https://self-hosted.example.test');
    });

    it('rejects missing or mismatched WebView account associations', () => {
      const trustedOrigins = {
        'account-a': 'https://app.example.test',
        'account-b': 'https://self-hosted.example.test',
      };
      const missingAccount = OriginValidator.getTrustedWebviewAccount({
        accountId: Maybe.nothing<string>(),
        candidateUrl: 'https://app.example.test/login',
        trustedOrigins,
      });
      const mismatchedAccount = OriginValidator.getTrustedWebviewAccount({
        accountId: Maybe.just('account-a'),
        candidateUrl: 'https://self-hosted.example.test/login',
        trustedOrigins,
      });
      const untrustedAccount = OriginValidator.getTrustedWebviewAccount({
        accountId: Maybe.just('account-c'),
        candidateUrl: 'https://app.example.test/login',
        trustedOrigins,
      });
      const matchedAccount = OriginValidator.getTrustedWebviewAccount({
        accountId: Maybe.just('account-b'),
        candidateUrl: 'https://self-hosted.example.test/login',
        trustedOrigins,
      });

      assert.strictEqual(missingAccount.isNothing, true);
      assert.strictEqual(mismatchedAccount.isNothing, true);
      assert.strictEqual(untrustedAccount.isNothing, true);
      assert.deepStrictEqual(matchedAccount.unwrapOr({accountId: 'missing', trustedOrigin: 'missing'}), {
        accountId: 'account-b',
        trustedOrigin: 'https://self-hosted.example.test',
      });
    });

    it('updates and removes only the selected account origin', () => {
      const firstTrustedOrigins = OriginValidator.updateTrustedOrigin({
        accountId: 'account-a',
        origin: 'https://staging.example.test',
        trustedOrigins: {'account-a': 'https://app.example.test', 'account-b': 'https://other.example.test'},
      });
      const actual = OriginValidator.removeTrustedOrigin('account-a', firstTrustedOrigins);

      assert.deepStrictEqual(actual, {'account-b': 'https://other.example.test'});
    });
  });

  describe('getInitialTrustedOrigin', () => {
    it('accepts the desktop-configured origin without a confirmation', () => {
      let wasConfirmationRequested = false;

      const actual = OriginValidator.getInitialTrustedOrigin({
        accountId: 'account-a',
        configuredUrl: Maybe.just('https://app.example.test'),
        confirmOriginChange() {
          wasConfirmationRequested = true;
          return false;
        },
        destinationUrl: 'https://app.example.test/login?id=account-a',
        trustedOrigins: {},
      });

      assert.strictEqual(actual.unwrapOr('missing'), 'https://app.example.test');
      assert.strictEqual(wasConfirmationRequested, false);
    });

    it('continues to trust a previously approved self-hosted account after restart', () => {
      let wasConfirmationRequested = false;

      const actual = OriginValidator.getInitialTrustedOrigin({
        accountId: 'account-a',
        configuredUrl: Maybe.just('https://app.example.test'),
        confirmOriginChange() {
          wasConfirmationRequested = true;
          return false;
        },
        destinationUrl: 'https://chat.customer.example/login?id=account-a',
        trustedOrigins: {'account-a': 'https://chat.customer.example'},
      });

      assert.strictEqual(actual.unwrapOr('missing'), 'https://chat.customer.example');
      assert.strictEqual(wasConfirmationRequested, false);
    });

    it('requires explicit confirmation for an account-specific self-hosted origin', () => {
      const confirmedOrigins: string[] = [];

      const actual = OriginValidator.getInitialTrustedOrigin({
        accountId: 'account-a',
        configuredUrl: Maybe.just('https://app.example.test'),
        confirmOriginChange(origin) {
          confirmedOrigins.push(origin);
          return true;
        },
        destinationUrl: 'https://chat.customer.example/path?id=account-a',
        trustedOrigins: {},
      });

      assert.strictEqual(actual.unwrapOr('missing'), 'https://chat.customer.example');
      assert.deepStrictEqual(confirmedOrigins, ['https://chat.customer.example']);
    });

    it('rejects a declined or malformed initial destination', () => {
      let wasConfirmationRequested = false;

      const declined = OriginValidator.getInitialTrustedOrigin({
        accountId: 'account-a',
        configuredUrl: Maybe.nothing<string>(),
        confirmOriginChange() {
          wasConfirmationRequested = true;
          return false;
        },
        destinationUrl: 'https://custom.example.test',
        trustedOrigins: {},
      });
      const malformed = OriginValidator.getInitialTrustedOrigin({
        accountId: 'account-a',
        configuredUrl: Maybe.nothing<string>(),
        confirmOriginChange() {
          return true;
        },
        destinationUrl: 'javascript:alert(1)',
        trustedOrigins: {},
      });

      assert.strictEqual(declined.isNothing, true);
      assert.strictEqual(malformed.isNothing, true);
      assert.strictEqual(wasConfirmationRequested, true);
    });
  });

  describe('authorizeOriginChange', () => {
    it('returns an origin only after desktop confirmation', () => {
      const confirmedOrigins: string[] = [];

      const accepted = OriginValidator.authorizeOriginChange({
        confirmOriginChange(origin) {
          confirmedOrigins.push(origin);
          return true;
        },
        currentTrustedOrigin: Maybe.just('https://app.example.test'),
        destinationUrl: 'https://staging.example.test/path',
      });
      const declined = OriginValidator.authorizeOriginChange({
        confirmOriginChange(origin) {
          confirmedOrigins.push(origin);
          return false;
        },
        currentTrustedOrigin: Maybe.just('https://app.example.test'),
        destinationUrl: 'https://attacker.example/path',
      });

      assert.strictEqual(accepted.unwrapOr('missing'), 'https://staging.example.test');
      assert.strictEqual(declined.isNothing, true);
      assert.deepStrictEqual(confirmedOrigins, ['https://staging.example.test', 'https://attacker.example']);
    });

    it('allows same-origin changes and rejects missing trust without confirmation', () => {
      let wasConfirmationRequested = false;

      const sameOrigin = OriginValidator.authorizeOriginChange({
        confirmOriginChange() {
          wasConfirmationRequested = true;
          return false;
        },
        currentTrustedOrigin: Maybe.just('https://app.example.test'),
        destinationUrl: 'https://app.example.test/settings?tab=account',
      });
      const missingTrust = OriginValidator.authorizeOriginChange({
        confirmOriginChange() {
          wasConfirmationRequested = true;
          return true;
        },
        currentTrustedOrigin: Maybe.nothing<string>(),
        destinationUrl: 'https://attacker.example',
      });

      assert.strictEqual(sameOrigin.unwrapOr('missing'), 'https://app.example.test');
      assert.strictEqual(missingTrust.isNothing, true);
      assert.strictEqual(wasConfirmationRequested, false);
    });
  });
});

describe('WebviewNavigation', () => {
  it('prevents a meta-refresh navigation to an untrusted origin', () => {
    const willNavigateListeners: Array<(event: NavigationEvent, destinationUrl: string) => void> = [];
    const didStartNavigationListeners: Array<
      (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void
    > = [];
    const decisions: NavigationDecision[] = [];
    const fakeNavigationSource = {
      onDidStartNavigation(
        listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
      ): void {
        didStartNavigationListeners.push(listener);
      },
      onWillNavigate(listener: (event: NavigationEvent, destinationUrl: string) => void): void {
        willNavigateListeners.push(listener);
      },
      onWillRedirect(): void {},
      stopNavigation(): void {},
    };
    const wasPrevented = {value: false};

    registerNavigationEventHandlers({
      getNavigationOrigins() {
        return {
          pendingOrigin: Maybe.nothing<string>(),
          trustedOrigin: Maybe.just('https://app.example.test'),
        };
      },
      logNavigationDecision(decision) {
        decisions.push(decision);
      },
      onDidStartNavigation: fakeNavigationSource.onDidStartNavigation,
      onWillNavigate: fakeNavigationSource.onWillNavigate,
      onWillRedirect: fakeNavigationSource.onWillRedirect,
      stopNavigation: fakeNavigationSource.stopNavigation,
    });
    willNavigateListeners[0](createNavigationEvent(wasPrevented), 'https://attacker.example/stage2/');
    const actualDecision = decisions[0];

    assert.strictEqual(wasPrevented.value, true);
    assert.strictEqual(actualDecision.allowed, false);
    assert.strictEqual(actualDecision.destinationOrigin, 'https://attacker.example');
  });

  it('wires and prevents untrusted page navigation and main-frame redirects', () => {
    const willNavigateListeners: Array<(event: NavigationEvent, destinationUrl: string) => void> = [];
    const willRedirectListeners: Array<
      (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void
    > = [];
    const didStartNavigationListeners: Array<
      (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void
    > = [];
    const loggedDecisions: NavigationDecision[] = [];
    let wasProgrammaticNavigationStopped = false;
    const fakeNavigationSource = {
      onDidStartNavigation(
        listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
      ): void {
        didStartNavigationListeners.push(listener);
      },
      onWillNavigate(listener: (event: NavigationEvent, destinationUrl: string) => void): void {
        willNavigateListeners.push(listener);
      },
      onWillRedirect(
        listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
      ): void {
        willRedirectListeners.push(listener);
      },
      stopNavigation() {
        wasProgrammaticNavigationStopped = true;
      },
    };

    registerNavigationEventHandlers({
      getNavigationOrigins() {
        return {
          pendingOrigin: Maybe.nothing<string>(),
          trustedOrigin: Maybe.just('https://app.example.test'),
        };
      },
      logNavigationDecision(decision) {
        loggedDecisions.push(decision);
      },
      onDidStartNavigation: fakeNavigationSource.onDidStartNavigation,
      onWillNavigate: fakeNavigationSource.onWillNavigate,
      onWillRedirect: fakeNavigationSource.onWillRedirect,
      stopNavigation: fakeNavigationSource.stopNavigation,
    });

    const navigationWasPrevented = {value: false};
    willNavigateListeners[0](createNavigationEvent(navigationWasPrevented), 'https://attacker.example/path');
    const redirectWasPrevented = {value: false};
    willRedirectListeners[0](
      createNavigationEvent(redirectWasPrevented),
      'https://attacker.example/redirected',
      false,
      true,
    );
    const allowedNavigationWasPrevented = {value: false};
    willNavigateListeners[0](
      createNavigationEvent(allowedNavigationWasPrevented),
      'https://app.example.test/settings?tab=privacy#keys',
    );
    didStartNavigationListeners[0](
      createNavigationEvent({value: false}),
      'https://previously-trusted.example/back-navigation',
      false,
      true,
    );

    assert.strictEqual(navigationWasPrevented.value, true);
    assert.strictEqual(redirectWasPrevented.value, true);
    assert.strictEqual(allowedNavigationWasPrevented.value, false);
    const actualAllowedDecisions: boolean[] = [];
    for (const decision of loggedDecisions) {
      actualAllowedDecisions.push(decision.allowed);
    }

    assert.deepStrictEqual(actualAllowedDecisions, [false, false, true, false]);
    assert.strictEqual(wasProgrammaticNavigationStopped, true);
  });

  it('does not prevent subframe redirects', () => {
    const willRedirectListeners: Array<
      (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void
    > = [];
    const didStartNavigationListeners: Array<
      (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void
    > = [];
    const fakeNavigationSource = {
      onDidStartNavigation(
        listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
      ): void {
        didStartNavigationListeners.push(listener);
      },
      onWillNavigate(): void {},
      onWillRedirect(
        listener: (event: NavigationEvent, destinationUrl: string, isInPlace: boolean, isMainFrame: boolean) => void,
      ): void {
        willRedirectListeners.push(listener);
      },
      stopNavigation(): void {},
    };
    const wasPrevented = {value: false};

    registerNavigationEventHandlers({
      getNavigationOrigins() {
        return {
          pendingOrigin: Maybe.nothing<string>(),
          trustedOrigin: Maybe.just('https://app.example.test'),
        };
      },
      logNavigationDecision(): void {},
      onDidStartNavigation: fakeNavigationSource.onDidStartNavigation,
      onWillNavigate: fakeNavigationSource.onWillNavigate,
      onWillRedirect: fakeNavigationSource.onWillRedirect,
      stopNavigation: fakeNavigationSource.stopNavigation,
    });
    willRedirectListeners[0](createNavigationEvent(wasPrevented), 'https://tracker.example/pixel', false, false);
    didStartNavigationListeners[0](
      createNavigationEvent({value: false}),
      'https://tracker.example/pixel',
      false,
      false,
    );

    assert.strictEqual(wasPrevented.value, false);
  });

  it('allows the approved origin during a controlled transition while retaining the current origin', () => {
    const trustedOrigin = Maybe.just('https://app.example.test');
    const pendingOrigin = Maybe.just('https://staging.example.test');
    const isTrustedOriginAllowed = OriginValidator.isAllowedNavigation('https://app.example.test/path', {
      pendingOrigin,
      trustedOrigin,
    });
    const isPendingOriginAllowed = OriginValidator.isAllowedNavigation('https://staging.example.test/path', {
      pendingOrigin,
      trustedOrigin,
    });
    const isOtherOriginAllowed = OriginValidator.isAllowedNavigation('https://attacker.example/path', {
      pendingOrigin,
      trustedOrigin,
    });

    assert.strictEqual(isTrustedOriginAllowed, true);
    assert.strictEqual(isPendingOriginAllowed, true);
    assert.strictEqual(isOtherOriginAllowed, false);
  });

  it('commits an authorized origin only after the requested origin loads successfully', async () => {
    let currentUrl = 'https://app.example.test/start';
    const committedOrigins: string[] = [];
    const pendingOrigins: Array<Maybe<string>> = [];

    const actual = await navigateWebviewDestination({
      currentTrustedOrigin: 'https://app.example.test',
      dependencies: {
        authorizeOriginChange(destinationUrl, currentTrustedOrigin) {
          return OriginValidator.authorizeOriginChange({
            confirmOriginChange() {
              return true;
            },
            currentTrustedOrigin: Maybe.just(currentTrustedOrigin),
            destinationUrl,
          });
        },
        commitTrustedOrigin(origin) {
          committedOrigins.push(origin);
        },
        getCurrentUrl() {
          return currentUrl;
        },
        async loadUrl(destinationUrl) {
          currentUrl = destinationUrl;
        },
        setPendingOrigin(origin) {
          pendingOrigins.push(origin);
        },
      },
      destinationUrl: 'https://staging.example.test/app?id=account-a',
    });

    assert.strictEqual(actual, true);
    assert.deepStrictEqual(committedOrigins, ['https://staging.example.test']);
    assert.strictEqual(pendingOrigins[0].unwrapOr('missing'), 'https://staging.example.test');
    assert.strictEqual(pendingOrigins[1].isNothing, true);
  });

  it('leaves the trusted origin unchanged when the authorized load fails or redirects elsewhere', async () => {
    const committedOrigins: string[] = [];
    const pendingOrigins: Array<Maybe<string>> = [];

    const failedLoad = await navigateWebviewDestination({
      currentTrustedOrigin: 'https://app.example.test',
      dependencies: {
        authorizeOriginChange(destinationUrl, currentTrustedOrigin) {
          return OriginValidator.authorizeOriginChange({
            confirmOriginChange() {
              return true;
            },
            currentTrustedOrigin: Maybe.just(currentTrustedOrigin),
            destinationUrl,
          });
        },
        commitTrustedOrigin(origin) {
          committedOrigins.push(origin);
        },
        getCurrentUrl() {
          return 'https://app.example.test/start';
        },
        async loadUrl() {
          throw new Error('navigation failed');
        },
        setPendingOrigin(origin) {
          pendingOrigins.push(origin);
        },
      },
      destinationUrl: 'https://staging.example.test/app',
    });
    const redirectedLoad = await navigateWebviewDestination({
      currentTrustedOrigin: 'https://app.example.test',
      dependencies: {
        authorizeOriginChange(destinationUrl, currentTrustedOrigin) {
          return OriginValidator.authorizeOriginChange({
            confirmOriginChange() {
              return true;
            },
            currentTrustedOrigin: Maybe.just(currentTrustedOrigin),
            destinationUrl,
          });
        },
        commitTrustedOrigin(origin) {
          committedOrigins.push(origin);
        },
        getCurrentUrl() {
          return 'https://attacker.example/redirected';
        },
        async loadUrl(): Promise<void> {},
        setPendingOrigin(origin) {
          pendingOrigins.push(origin);
        },
      },
      destinationUrl: 'https://staging.example.test/app',
    });

    assert.strictEqual(failedLoad, false);
    assert.strictEqual(redirectedLoad, false);
    assert.deepStrictEqual(committedOrigins, []);
    assert.strictEqual(pendingOrigins[1].isNothing, true);
    assert.strictEqual(pendingOrigins[3].isNothing, true);
  });

  it('serializes concurrent account navigation requests in request order', async () => {
    const navigationQueue = createWebviewNavigationQueue();
    const actualOperations: string[] = [];
    let releaseFirstNavigation: () => void = () => {};
    const firstNavigationStarted = new Promise<void>(resolve => {
      releaseFirstNavigation = resolve;
    });
    async function firstOperation(): Promise<boolean> {
      actualOperations.push('first-start');
      await firstNavigationStarted;
      actualOperations.push('first-finish');
      return true;
    }
    async function secondOperation(): Promise<boolean> {
      actualOperations.push('second');
      return true;
    }

    const firstNavigation = navigationQueue(firstOperation);
    const secondNavigation = navigationQueue(secondOperation);
    await Promise.resolve();
    const actualBeforeRelease = actualOperations.slice();
    releaseFirstNavigation();
    const navigationResults = await Promise.all([firstNavigation, secondNavigation]);

    assert.deepStrictEqual(actualBeforeRelease, ['first-start']);
    assert.deepStrictEqual(actualOperations, ['first-start', 'first-finish', 'second']);
    assert.deepStrictEqual(navigationResults, [true, true]);
  });
});

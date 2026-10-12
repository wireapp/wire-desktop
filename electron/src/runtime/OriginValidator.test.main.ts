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

import {OriginValidator} from './OriginValidator';

describe('OriginValidator', () => {
  describe('isMatchingOrigin', () => {
    it('allows same-origin navigation with different paths, queries, and fragments', () => {
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

    it('supports configured self-hosted origins', () => {
      const actual = OriginValidator.isMatchingOrigin(
        'https://chat.customer.example:9443/path',
        Maybe.just('https://chat.customer.example:9443'),
      );

      assert.strictEqual(actual, true);
    });

    it('supports an explicitly configured local HTTP development origin', () => {
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

  describe('preventNavigationOutsideTrustedOrigin', () => {
    it('prevents a meta-refresh destination outside the account origin', () => {
      let wasPrevented = false;
      const metaRefreshDestination = 'https://attacker.example/stage2/';

      const actual = OriginValidator.preventNavigationOutsideTrustedOrigin({
        destinationUrl: metaRefreshDestination,
        event: {
          preventDefault() {
            wasPrevented = true;
          },
        },
        trustedOrigin: Maybe.just('https://app.example.test'),
      });

      assert.strictEqual(actual, false);
      assert.strictEqual(wasPrevented, true);
    });

    it('prevents an HTTP redirect outside the account origin', () => {
      let wasPrevented = false;

      const actual = OriginValidator.preventNavigationOutsideTrustedOrigin({
        destinationUrl: 'https://attacker.example/redirected',
        event: {
          preventDefault() {
            wasPrevented = true;
          },
        },
        trustedOrigin: Maybe.just('https://app.example.test'),
      });

      assert.strictEqual(actual, false);
      assert.strictEqual(wasPrevented, true);
    });

    it('does not prevent same-origin navigation', () => {
      let wasPrevented = false;

      const actual = OriginValidator.preventNavigationOutsideTrustedOrigin({
        destinationUrl: 'https://app.example.test/settings?section=profile',
        event: {
          preventDefault() {
            wasPrevented = true;
          },
        },
        trustedOrigin: Maybe.just('https://app.example.test'),
      });

      assert.strictEqual(actual, true);
      assert.strictEqual(wasPrevented, false);
    });

    it('prevents navigation when trusted-origin configuration is missing or invalid', () => {
      const wasNavigationPreventedForEachOrigin: boolean[] = [];
      const trustedOrigins = [Maybe.nothing<string>(), Maybe.just('not a URL')];

      for (const trustedOrigin of trustedOrigins) {
        const wasPrevented = {value: false};
        const isAllowed = OriginValidator.preventNavigationOutsideTrustedOrigin({
          destinationUrl: 'https://app.example.test/',
          event: {
            preventDefault() {
              wasPrevented.value = true;
            },
          },
          trustedOrigin,
        });

        wasNavigationPreventedForEachOrigin.push(wasPrevented.value);
        assert.strictEqual(isAllowed, false);
      }

      assert.deepStrictEqual(wasNavigationPreventedForEachOrigin, [true, true]);
    });
  });

  describe('initializeTrustedOrigin', () => {
    it('accepts a URL whose origin is explicitly present in desktop configuration', () => {
      const trustedOriginsByAccountId = new Map<string, string>();
      let wasConfirmationRequested = false;

      const actual = OriginValidator.initializeTrustedOrigin({
        accountId: 'account-a',
        configuredUrls: ['https://app.example.test'],
        confirmOriginChange() {
          wasConfirmationRequested = true;
          return false;
        },
        destinationUrl: 'https://app.example.test/login?id=account-a',
        trustedOriginsByAccountId,
      });

      assert.strictEqual(actual, true);
      assert.strictEqual(wasConfirmationRequested, false);
      assert.strictEqual(trustedOriginsByAccountId.get('account-a'), 'https://app.example.test');
    });

    it('accepts an explicitly configured local HTTP development origin', () => {
      const trustedOriginsByAccountId = new Map<string, string>();

      const actual = OriginValidator.initializeTrustedOrigin({
        accountId: 'account-a',
        configuredUrls: ['http://localhost:8081'],
        confirmOriginChange() {
          return false;
        },
        destinationUrl: 'http://localhost:8081/login?id=account-a',
        trustedOriginsByAccountId,
      });

      assert.strictEqual(actual, true);
      assert.strictEqual(trustedOriginsByAccountId.get('account-a'), 'http://localhost:8081');
    });

    it('fails closed when no valid trusted-origin configuration exists', () => {
      const trustedOriginsByAccountId = new Map<string, string>();
      let wasConfirmationRequested = false;

      const actual = OriginValidator.initializeTrustedOrigin({
        accountId: 'account-a',
        configuredUrls: ['not a URL'],
        confirmOriginChange() {
          wasConfirmationRequested = true;
          return true;
        },
        destinationUrl: 'https://custom.example.test',
        trustedOriginsByAccountId,
      });

      assert.strictEqual(actual, false);
      assert.strictEqual(wasConfirmationRequested, false);
      assert.strictEqual(trustedOriginsByAccountId.has('account-a'), false);
    });

    it('requires desktop confirmation for an account-specific configured URL', () => {
      const trustedOriginsByAccountId = new Map<string, string>();
      const confirmedOrigins: string[] = [];

      const actual = OriginValidator.initializeTrustedOrigin({
        accountId: 'account-a',
        configuredUrls: ['https://app.example.test'],
        confirmOriginChange(origin) {
          confirmedOrigins.push(origin);
          return true;
        },
        destinationUrl: 'https://self-hosted.example.test/path?id=account-a',
        trustedOriginsByAccountId,
      });

      assert.strictEqual(actual, true);
      assert.deepStrictEqual(confirmedOrigins, ['https://self-hosted.example.test']);
      assert.strictEqual(trustedOriginsByAccountId.get('account-a'), 'https://self-hosted.example.test');
    });
  });

  describe('authorizeOriginChange', () => {
    it('does not redefine an account origin when desktop confirmation is declined', () => {
      const trustedOriginsByAccountId = new Map([['account-a', 'https://app.example.test']]);
      const confirmedOrigins: string[] = [];

      const actual = OriginValidator.authorizeOriginChange({
        accountId: 'account-a',
        confirmOriginChange(origin) {
          confirmedOrigins.push(origin);
          return false;
        },
        destinationUrl: 'https://attacker.example/new-backend',
        trustedOriginsByAccountId,
      });

      assert.strictEqual(actual, false);
      assert.deepStrictEqual(confirmedOrigins, ['https://attacker.example']);
      assert.strictEqual(trustedOriginsByAccountId.get('account-a'), 'https://app.example.test');
    });

    it('updates only the account whose environment change was confirmed', () => {
      const trustedOriginsByAccountId = new Map([
        ['account-a', 'https://app.example.test'],
        ['account-b', 'https://self-hosted.example.test'],
      ]);

      const actual = OriginValidator.authorizeOriginChange({
        accountId: 'account-a',
        confirmOriginChange() {
          return true;
        },
        destinationUrl: 'https://staging.example.test/path',
        trustedOriginsByAccountId,
      });

      assert.strictEqual(actual, true);
      assert.strictEqual(trustedOriginsByAccountId.get('account-a'), 'https://staging.example.test');
      assert.strictEqual(trustedOriginsByAccountId.get('account-b'), 'https://self-hosted.example.test');
    });

    it('rejects programmatic changes without a valid current trusted origin', () => {
      const trustedOriginsByAccountId = new Map<string, string>();

      const actual = OriginValidator.authorizeOriginChange({
        accountId: 'account-a',
        confirmOriginChange() {
          return true;
        },
        destinationUrl: 'https://attacker.example',
        trustedOriginsByAccountId,
      });

      assert.strictEqual(actual, false);
      assert.strictEqual(trustedOriginsByAccountId.has('account-a'), false);
    });
  });
});

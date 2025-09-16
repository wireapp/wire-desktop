/*
 * Wire
 * Copyright (C) 2024 Wire Swiss GmbH
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

import {shell} from 'electron';
import {stub, SinonStub} from 'sinon';

import * as assert from 'assert';

import {ExternalBrowserAuth} from './ExternalBrowserAuth';

describe('ExternalBrowserAuth', () => {
  let auth: ExternalBrowserAuth;
  let shellStub: SinonStub;

  const mockConfig = {
    authUrl: 'https://staging-nginz-https.zinfra.io/sso/initiate-login/test',
    callbackUrl: 'wire-auth://callback/sso',
    allowedOrigins: ['https://staging-nginz-https.zinfra.io'],
    timeout: 30000,
  };

  beforeEach(() => {
    auth = new ExternalBrowserAuth();
    shellStub = stub(shell, 'openExternal').resolves();
  });

  afterEach(() => {
    shellStub.restore();
    auth.cancel();
  });

  describe('authenticate', () => {
    it('should reject invalid auth URLs', async () => {
      const invalidConfig = {
        ...mockConfig,
        authUrl: 'javascript:alert("xss")', // NOSONAR - Testing security validation
      };

      try {
        await auth.authenticate(invalidConfig);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Invalid auth URL'));
      }
    });

    it('should reject auth URLs from non-allowed origins', async () => {
      const invalidConfig = {
        ...mockConfig,
        authUrl: 'https://evil.com/sso/login',
      };

      try {
        await auth.authenticate(invalidConfig);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Invalid auth URL'));
      }
    });

    it('should prevent multiple concurrent authentications', async () => {
      const firstAuth = auth.authenticate(mockConfig);

      try {
        await auth.authenticate(mockConfig);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Authentication already in progress'));
      }

      auth.cancel();

      try {
        await firstAuth;
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });

    it('should open external browser with correct URL', async () => {
      const authPromise = auth.authenticate(mockConfig);

      assert.strictEqual(shellStub.calledOnce, true);
      const calledUrl = shellStub.getCall(0).args[0];
      assert.ok(calledUrl.includes('https://staging-nginz-https.zinfra.io/sso/initiate-login/test'));

      auth.cancel();

      try {
        await authPromise;
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing authentication', async () => {
      const authPromise = auth.authenticate(mockConfig);

      auth.cancel();

      try {
        await authPromise;
        assert.fail('Should have been cancelled');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });

    it('should be safe to call multiple times', () => {
      auth.cancel();
      auth.cancel();

      assert.strictEqual(auth.isAuthInProgress(), false);
    });
  });

  describe('handleCallback', () => {
    it('should return false when no authentication in progress', () => {
      const callbackUrl = 'wire-auth://callback/sso?code=test-code&state=test-state';
      const result = auth.handleCallback(callbackUrl);

      assert.strictEqual(result, false);
    });

    it('should return true when authentication is in progress', async () => {
      const authPromise = auth.authenticate(mockConfig);

      const callbackUrl = 'wire-auth://callback/sso?error=access_denied';
      const result = auth.handleCallback(callbackUrl);

      assert.strictEqual(result, true);

      try {
        await authPromise;
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });

    it('should handle invalid callback URLs gracefully', async () => {
      const authPromise = auth.authenticate(mockConfig);

      const result = auth.handleCallback('invalid-url');

      assert.strictEqual(result, true);

      try {
        await authPromise;
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('isAuthInProgress', () => {
    it('should return false when no authentication in progress', () => {
      assert.strictEqual(auth.isAuthInProgress(), false);
    });

    it('should return true when authentication is in progress', async () => {
      const authPromise = auth.authenticate(mockConfig);

      assert.strictEqual(auth.isAuthInProgress(), true);

      auth.cancel();

      try {
        await authPromise;
      } catch (error) {
        assert.ok(error instanceof Error);
      }

      assert.strictEqual(auth.isAuthInProgress(), false);
    });
  });
});

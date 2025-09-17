/*
 * Wire
 * Copyright (C) 2025 Wire Swiss GmbH
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

import {OriginValidator} from './OriginValidator';

describe('OriginValidator', () => {
  const allowedOrigins = ['https://staging-nginz-https.zinfra.io', 'https://prod-nginz-https.wire.com'];

  describe('isMatchingHost', () => {
    it('should return true for matching hosts', () => {
      const url1 = 'https://example.com/path1';
      const url2 = 'https://example.com/path2';

      assert.strictEqual(OriginValidator.isMatchingHost(url1, url2), true);
    });

    it('should return false for different hosts', () => {
      const url1 = 'https://example.com/path1';
      const url2 = 'https://different.com/path2';

      assert.strictEqual(OriginValidator.isMatchingHost(url1, url2), false);
    });

    it('should handle invalid URLs gracefully', () => {
      assert.strictEqual(OriginValidator.isMatchingHost('invalid-url', 'https://example.com'), false);
    });
  });

  describe('validateSSORedirectURL', () => {
    it('should accept valid HTTPS URLs from allowed origins', () => {
      const result = OriginValidator.validateSSORedirectURL(
        'https://staging-nginz-https.zinfra.io/sso/login',
        allowedOrigins,
      );
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.sanitizedUrl, 'https://staging-nginz-https.zinfra.io/sso/login');
    });

    it('should reject HTTP URLs', () => {
      const result = OriginValidator.validateSSORedirectURL(
        'http://staging-nginz-https.zinfra.io/sso/login', // NOSONAR - Testing security validation
        allowedOrigins,
      );
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.reason, 'Only HTTPS protocol is allowed for SSO redirects');
    });

    it('should reject URLs from non-allowed origins', () => {
      const result = OriginValidator.validateSSORedirectURL('https://evil.com/sso/login', allowedOrigins);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.reason?.includes('Origin https://evil.com is not in the allowed list'));
    });

    it('should reject URLs with suspicious patterns', () => {
      const result = OriginValidator.validateSSORedirectURL(
        'https://staging-nginz-https.zinfra.io/javascript:alert("xss")',
        allowedOrigins,
      );
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.reason, 'URL contains suspicious patterns');
    });

    it('should reject URLs with invalid SSO paths', () => {
      const result = OriginValidator.validateSSORedirectURL(
        'https://staging-nginz-https.zinfra.io/invalid/path',
        allowedOrigins,
      );
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.reason, 'Invalid SSO path detected');
    });

    it('should handle invalid URL format', () => {
      const result = OriginValidator.validateSSORedirectURL('invalid-url', allowedOrigins);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.reason?.includes('Invalid URL format'));
    });
  });

  describe('containsSuspiciousPatterns', () => {
    it('should detect javascript: protocol', () => {
      assert.strictEqual(OriginValidator.containsSuspiciousPatterns('javascript:alert("xss")'), true); // NOSONAR - Testing security validation
    });

    it('should detect data: URLs', () => {
      assert.strictEqual(
        OriginValidator.containsSuspiciousPatterns('data:text/html,<script>alert("xss")</script>'), // NOSONAR - Testing security validation
        true,
      );
    });

    it('should detect file: protocol', () => {
      assert.strictEqual(OriginValidator.containsSuspiciousPatterns('file:///etc/passwd'), true);
    });

    it('should detect FTP protocol', () => {
      assert.strictEqual(OriginValidator.containsSuspiciousPatterns('ftp://example.com/file'), true);
    });

    it('should detect encoded javascript', () => {
      assert.strictEqual(OriginValidator.containsSuspiciousPatterns('%6a%61%76%61%73%63%72%69%70%74'), true);
    });

    it('should detect punycode domains', () => {
      assert.strictEqual(OriginValidator.containsSuspiciousPatterns('https://xn--e1afmkfd.xn--p1ai'), true);
    });

    it('should allow clean URLs', () => {
      assert.strictEqual(OriginValidator.containsSuspiciousPatterns('https://example.com/path'), false);
    });
  });

  describe('isValidSSOPath', () => {
    const validPaths = [
      '/sso/login',
      '/auth/callback',
      '/login/oauth',
      '/oauth/authorize',
      '/saml/acs',
      '/oidc/callback',
      '/api/v1/sso/login',
      '/api/v2/auth/callback',
    ];

    const invalidPaths = ['/invalid/path', '/admin/users', '/api/users', '/public/assets'];

    validPaths.forEach(path => {
      it(`should accept valid SSO path: ${path}`, () => {
        assert.strictEqual(OriginValidator.isValidSSOPath(path), true);
      });
    });

    invalidPaths.forEach(path => {
      it(`should reject invalid path: ${path}`, () => {
        assert.strictEqual(OriginValidator.isValidSSOPath(path), false);
      });
    });
  });

  describe('validateMessageOrigin', () => {
    it('should return true for matching origins', () => {
      const result = OriginValidator.validateMessageOrigin('https://example.com', 'https://example.com');
      assert.strictEqual(result, true);
    });

    it('should return false for different origins', () => {
      const result = OriginValidator.validateMessageOrigin('https://example.com', 'https://different.com');
      assert.strictEqual(result, false);
    });

    it('should handle invalid URLs gracefully', () => {
      const result = OriginValidator.validateMessageOrigin('invalid-url', 'https://example.com');
      assert.strictEqual(result, false);
    });
  });
});

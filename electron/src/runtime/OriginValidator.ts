/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import {URL} from 'url';

import {config} from '../settings/config';

export interface URLValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export const OriginValidator = {
  isMatchingHost(urlString: string, baseUrl: string): boolean {
    try {
      return new URL(urlString).host === new URL(baseUrl).host;
    } catch {
      return false;
    }
  },

  /**
   * Validates if a URL is safe for SSO redirects
   *
   * SSO authentication flow requires navigation to external identity provider domains
   * (SAML, OAuth, OIDC providers) which are not known beforehand. This validator allows:
   * 1. Wire backend origins (staging and production)
   * 2. External HTTPS domains with valid SSO paths for identity provider redirects
   *
   * @param {string} urlString The URL to validate
   * @param {string[]} allowedOrigins List of allowed Wire backend origins for SSO
   * @returns {URLValidationResult} Validation result with details
   */
  validateSSORedirectURL(urlString: string, allowedOrigins: string[] = config.backendOrigins): URLValidationResult {
    try {
      const url = new URL(urlString);

      // Require HTTPS for all SSO redirects
      if (url.protocol !== 'https:') {
        return {
          isValid: false,
          reason: 'Only HTTPS protocol is allowed for SSO redirects',
        };
      }

      // Check for suspicious patterns first (applies to all URLs)
      if (this.containsSuspiciousPatterns(urlString)) {
        return {
          isValid: false,
          reason: 'URL contains suspicious patterns',
        };
      }

      // Validate hostname length
      if (url.hostname.length > 253) {
        return {
          isValid: false,
          reason: 'Hostname exceeds maximum allowed length',
        };
      }

      const origin = url.origin;
      const isWireBackend = allowedOrigins.includes(origin);

      if (isWireBackend) {
        if (!this.isValidSSOPath(url.pathname)) {
          return {
            isValid: false,
            reason: 'Invalid SSO path detected for Wire backend',
          };
        }
      } else {
        // For external identity provider domains, apply additional security checks
        // These are SAML/OAuth/OIDC providers that users authenticate against

        if (!this.isValidHostname(url.hostname)) {
          return {
            isValid: false,
            reason: 'Invalid hostname format for external identity provider',
          };
        }

        // External domains should have reasonable paths (not just root)
        // Identity providers typically use paths like /saml/login, /oauth/authorize, etc.
        if (url.pathname === '/' && !url.search) {
          return {
            isValid: false,
            reason: 'External identity provider URL must include a path or query parameters',
          };
        }
      }

      return {
        isValid: true,
        sanitizedUrl: url.toString(),
      };
    } catch (error) {
      return {
        isValid: false,
        reason: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },

  /**
   * Checks for suspicious patterns that might indicate malicious URLs
   * @param {string} urlString The URL string to check
   * @returns {boolean} True if suspicious patterns are found
   */
  containsSuspiciousPatterns(urlString: string): boolean {
    const suspiciousPatterns = [
      // JavaScript protocol
      /javascript:/i,
      // Data URLs
      /data:/i,
      // File protocol
      /file:/i,
      // FTP protocol
      /ftp:/i,
      // Suspicious URL encoding
      /%2[fF]%2[fF]/, // Double slash encoding
      /%6a%61%76%61%73%63%72%69%70%74/i, // "javascript" encoded
      // Suspicious characters (non-printable characters)
      /[^\x20-\x7e]/, // Non-printable ASCII characters
      // Suspicious domains (homograph attacks)
      /xn--/, // Punycode domains
    ];

    return suspiciousPatterns.some(pattern => pattern.test(urlString));
  },

  /**
   * Validates if the path is appropriate for SSO endpoints
   * @param {string} pathname The pathname to validate
   * @returns {boolean} True if the path is valid for SSO
   */
  isValidSSOPath(pathname: string): boolean {
    const allowedSSOPaths = [
      /^\/sso\//,
      /^\/auth\//,
      /^\/login\//,
      /^\/oauth\//,
      /^\/saml\//,
      /^\/oidc\//,
      /^\/api\/v\d+\/sso\//,
      /^\/api\/v\d+\/auth\//,
    ];

    return allowedSSOPaths.some(pattern => pattern.test(pathname));
  },

  /**
   * Validates if a hostname is properly formatted
   * @param {string} hostname The hostname to validate
   * @returns {boolean} True if the hostname is valid
   */
  isValidHostname(hostname: string): boolean {
    // Hostname should not be empty
    if (!hostname || hostname.length === 0) {
      return false;
    }

    // eslint-disable-next-line security/detect-unsafe-regex
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // eslint-disable-next-line security/detect-unsafe-regex
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)) {
      return false;
    }

    if (!hostname.includes('.')) {
      return false;
    }

    const hostnamePattern =
      // eslint-disable-next-line security/detect-unsafe-regex
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnamePattern.test(hostname)) {
      return false;
    }

    return true;
  },

  /**
   * Validates message origin for SSO communication
   * @param {string} messageOrigin The origin of the received message
   * @param {string} expectedOrigin The expected origin
   * @returns {boolean} True if origins match
   */
  validateMessageOrigin(messageOrigin: string, expectedOrigin: string): boolean {
    try {
      const messageUrl = new URL(messageOrigin);
      const expectedUrl = new URL(expectedOrigin);

      return messageUrl.origin === expectedUrl.origin;
    } catch {
      return false;
    }
  },
};

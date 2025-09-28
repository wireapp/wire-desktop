/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import type {WebContents} from 'electron';
import {ESLint} from 'eslint';
import validator from 'validator';
import * as xss from 'xss';

export class JavaScriptSecurityError extends Error {
  constructor(message: string, public readonly reason: string) {
    super(message);
    this.name = 'JavaScriptSecurityError';
  }
}

const SECURITY_CONFIG = {
  MAX_SNIPPET_LENGTH: 10000,
  XSS_OPTIONS: {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'] as string[],
    allowCommentTag: false,
    css: false,
  },
  URL_VALIDATION_OPTIONS: {
    protocols: ['http', 'https'] as string[],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
  },
};

const ALLOWED_PATTERNS = {
  DEVTOOLS_WEBVIEW: /^document\.getElementsByTagName\("webview"\)\[\d+\]\.openDevTools\(\{mode:\s*"detach"\}\)$/,
  MESSAGE_DISPATCH: /^window\.dispatchEvent\(new MessageEvent\('message',\s*\{[\s\S]*?\}\)\)$/,
} as const;

async function validateWithESLintSecurity(snippet: string): Promise<boolean> {
  try {
    const eslint = new ESLint({
      baseConfig: {
        plugins: ['security', 'no-unsanitized'],
        rules: {
          'security/detect-eval-with-expression': 'error',
          'security/detect-non-literal-require': 'error',
          'security/detect-unsafe-regex': 'error',
          'security/detect-buffer-noassert': 'error',
          'security/detect-child-process': 'error',
          'security/detect-object-injection': 'error',
          'no-unsanitized/method': 'error',
          'no-unsanitized/property': 'error',
        },
      },
      useEslintrc: false,
    });

    const results = await eslint.lintText(snippet, {filePath: 'snippet.js'});

    if (results[0] && results[0].messages.length > 0) {
      const securityErrors = results[0].messages.filter(
        msg => msg.ruleId?.startsWith('security/') || msg.ruleId?.startsWith('no-unsanitized/'),
      );

      if (securityErrors.length > 0) {
        throw new JavaScriptSecurityError(
          `ESLint security violation: ${securityErrors[0].message}`,
          'ESLINT_SECURITY_VIOLATION',
        );
      }
    }

    return true;
  } catch (error) {
    if (error instanceof JavaScriptSecurityError) {
      throw error;
    }
    return true;
  }
}

function validateJavaScriptSnippet(snippet: string): boolean {
  if (typeof snippet !== 'string') {
    throw new JavaScriptSecurityError('Invalid input: snippet must be a string', 'INVALID_TYPE');
  }

  if (snippet.length === 0) {
    throw new JavaScriptSecurityError('Invalid input: snippet cannot be empty', 'EMPTY_SNIPPET');
  }

  if (snippet.length > SECURITY_CONFIG.MAX_SNIPPET_LENGTH) {
    throw new JavaScriptSecurityError(
      `Invalid input: snippet too long (max ${SECURITY_CONFIG.MAX_SNIPPET_LENGTH} characters)`,
      'SNIPPET_TOO_LONG',
    );
  }

  const normalizedSnippet = snippet.replaceAll(/\s+/g, ' ').trim();
  const xssFiltered = xss.filterXSS(snippet, SECURITY_CONFIG.XSS_OPTIONS);
  if (xssFiltered !== snippet) {
    throw new JavaScriptSecurityError(
      'JavaScript snippet contains potentially dangerous HTML or script content',
      'XSS_CONTENT_DETECTED',
    );
  }
  const urlPatterns = normalizedSnippet.match(/https?:\/\/[^\s'"]+/gi);
  if (urlPatterns) {
    for (const urlPattern of urlPatterns) {
      if (!validator.isURL(urlPattern, SECURITY_CONFIG.URL_VALIDATION_OPTIONS)) {
        throw new JavaScriptSecurityError(`Invalid URL pattern detected: ${urlPattern}`, 'INVALID_URL_PATTERN');
      }
    }
  }

  const isAllowedPattern = Object.values(ALLOWED_PATTERNS).some(pattern => pattern.test(normalizedSnippet));

  if (!isAllowedPattern) {
    throw new JavaScriptSecurityError(
      'JavaScript snippet does not match any allowed execution patterns',
      'PATTERN_NOT_ALLOWED',
    );
  }

  return true;
}

export async function executeJavaScriptWithoutResult(snippet: string, target: WebContents): Promise<void> {
  try {
    await validateWithESLintSecurity(snippet);
  } catch (eslintError) {
    if (eslintError instanceof JavaScriptSecurityError) {
      throw eslintError;
    }
  }

  validateJavaScriptSnippet(snippet);

  let cleanSnippet = snippet;
  while (cleanSnippet.endsWith(';')) {
    cleanSnippet = cleanSnippet.slice(0, -1);
  }
  const secureSnippet = `${cleanSnippet};0`;

  try {
    await target.executeJavaScript(secureSnippet);
  } catch (error) {
    throw new JavaScriptSecurityError(
      `Failed to execute JavaScript: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EXECUTION_FAILED',
    );
  }
}

export async function dispatchSSOMessage(type: string, origin: string, target: WebContents): Promise<void> {
  const typePattern = /^[A-Z_]{1,255}$/;
  if (!typePattern.test(type)) {
    throw new JavaScriptSecurityError('Invalid SSO message type format', 'INVALID_SSO_TYPE');
  }

  try {
    const url = new URL(origin);
    if (!['https:', 'http:'].includes(url.protocol)) {
      throw new JavaScriptSecurityError('Invalid origin protocol', 'INVALID_ORIGIN_PROTOCOL');
    }
  } catch (error) {
    if (error instanceof JavaScriptSecurityError) {
      throw error;
    }
    throw new JavaScriptSecurityError('Invalid origin URL format', 'INVALID_ORIGIN_URL');
  }

  const messageEvent = {
    origin: origin,
    data: {
      type: type,
    },
  };

  const snippet = `window.dispatchEvent(new MessageEvent('message', ${JSON.stringify(messageEvent)}))`;
  await executeJavaScriptWithoutResult(snippet, target);
}

export async function openWebViewDevTools(webViewIndex: number, target: WebContents): Promise<void> {
  if (!Number.isInteger(webViewIndex) || webViewIndex < 0 || webViewIndex > 99) {
    throw new JavaScriptSecurityError('Invalid webview index', 'INVALID_WEBVIEW_INDEX');
  }

  const snippet = `document.getElementsByTagName("webview")[${webViewIndex}].openDevTools({mode: "detach"})`;
  await executeJavaScriptWithoutResult(snippet, target);
}

export function shortenText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.substr(0, maxLength - 4)} ...` : text;
}

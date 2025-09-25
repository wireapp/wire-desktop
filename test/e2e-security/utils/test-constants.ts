/**
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
 */

/**
 * Common test constants and patterns for security e2e tests
 */

export const TEST_TIMEOUTS = {
  DEFAULT: 30000,
  LONG: 60000,
  SHORT: 5000,
  NETWORK: 10000,
  APP_READY: 15000,
} as const;

export const TEST_TAGS = {
  SECURITY: '@security',
  EXPOSURE: '@exposure',
  VALIDATION: '@validation',
  REGRESSION: '@regression',
  CONTEXT_ISOLATION: '@context-isolation',
  SANDBOX: '@sandbox',
  AUTH: '@auth',
  SSO: '@sso',
  SAML: '@saml',
  IPC: '@ipc',
  ROUTING: '@routing',
} as const;

export const SECURITY_APIS = {
  BLOCKED: ['require', 'process', 'global', '__dirname', '__filename', 'Buffer', 'setImmediate', 'clearImmediate'],
  ALLOWED: ['wireDesktop', 'wireWebview'],
  FILE_SYSTEM: ['showOpenFilePicker', 'showSaveFilePicker', 'showDirectoryPicker'],
} as const;

export const NETWORK_ENDPOINTS = {
  LOCALHOST: 'http://localhost:22',
  LOCAL_IP: 'http://127.0.0.1:22',
  FILE_PROTOCOL: 'file:///etc/passwd',
  STUN_SERVER: 'stun:stun.l.google.com:19302',
} as const;

export const WEBVIEW_SECURITY_ATTRIBUTES = {
  NODE_INTEGRATION: 'false',
  CONTEXT_ISOLATION: 'true',
  PLUGINS: 'false',
  WEB_SECURITY: 'true',
} as const;

export const TEST_EVALUATIONS = {
  checkAPIAvailability: (apis: string[]) => {
    return apis.reduce((result, api) => {
      result[api] = typeof (window as any)[api] !== 'undefined';
      return result;
    }, {} as Record<string, boolean>);
  },
};

export const COMMON_ASSERTIONS = {
  assertSecurityBlocked: (result: any, testName: string) => {
    if (!result.success) {
      throw new Error(`Security test failed: ${testName}`);
    }
  },

  assertAccessBlocked: (accessible: boolean, apiName: string) => {
    if (accessible) {
      throw new Error(`Security vulnerability: ${apiName} access not blocked`);
    }
  },

  assertWebviewSecurity: (config: any) => {
    if (config.nodeintegration !== WEBVIEW_SECURITY_ATTRIBUTES.NODE_INTEGRATION) {
      throw new Error(`Webview nodeintegration should be ${WEBVIEW_SECURITY_ATTRIBUTES.NODE_INTEGRATION}`);
    }
    if (config.contextIsolation !== WEBVIEW_SECURITY_ATTRIBUTES.CONTEXT_ISOLATION) {
      throw new Error(`Webview contextIsolation should be ${WEBVIEW_SECURITY_ATTRIBUTES.CONTEXT_ISOLATION}`);
    }
    if (config.plugins !== WEBVIEW_SECURITY_ATTRIBUTES.PLUGINS) {
      throw new Error(`Webview plugins should be ${WEBVIEW_SECURITY_ATTRIBUTES.PLUGINS}`);
    }
  },
};

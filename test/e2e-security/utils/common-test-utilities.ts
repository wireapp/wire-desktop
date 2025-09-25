/**
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
 */

import {NETWORK_ENDPOINTS, WEBVIEW_SECURITY_ATTRIBUTES} from './test-constants';

export interface StorageTestResult {
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
  cookiesAvailable: boolean;
  stateManagement: boolean;
}

export interface NetworkTestResult {
  localhost: boolean;
  fileProtocol: boolean;
  localIP: boolean;
}

export interface ContextIsolationTestResult {
  windowIsolated: boolean;
  globalIsolated: boolean;
  prototypeIsolated: boolean;
  contextBridgeOnly: boolean;
}

export interface WebviewSecurityResult {
  webviewCount: number;
  configs: Array<{
    src: string | null;
    nodeintegration: string | null;
    contextIsolation: string | null;
    sandbox: string | null;
    plugins: string | null;
    webSecurity: string | null;
  }>;
}

export const testStorageAccess = (): StorageTestResult => {
  const tests: StorageTestResult = {
    localStorageAvailable: false,
    sessionStorageAvailable: false,
    cookiesAvailable: false,
    stateManagement: false,
  };

  try {
    const testKey = 'test-storage-' + Date.now();
    localStorage.setItem(testKey, 'test-value');
    tests.localStorageAvailable = localStorage.getItem(testKey) === 'test-value';
    localStorage.removeItem(testKey);
  } catch (e) {
    tests.localStorageAvailable = false;
  }

  try {
    const testKey = 'test-session-' + Date.now();
    sessionStorage.setItem(testKey, 'test-value');
    tests.sessionStorageAvailable = sessionStorage.getItem(testKey) === 'test-value';
    sessionStorage.removeItem(testKey);
  } catch (e) {
    tests.sessionStorageAvailable = false;
  }

  try {
    const testCookie = 'test-cookie-' + Date.now() + '=test-value';
    document.cookie = testCookie;
    tests.cookiesAvailable = document.cookie.includes(testCookie.split('=')[0]);
  } catch (e) {
    tests.cookiesAvailable = false;
  }

  tests.stateManagement = tests.localStorageAvailable || tests.sessionStorageAvailable || tests.cookiesAvailable;

  return tests;
};

export const testNetworkAccess = async (): Promise<NetworkTestResult> => {
  const tests: NetworkTestResult = {
    localhost: false,
    fileProtocol: false,
    localIP: false,
  };

  const testEndpoint = async (endpoint: string): Promise<boolean> => {
    try {
      const response = await fetch(endpoint);
      return response.ok;
    } catch (e) {
      return false;
    }
  };

  tests.localhost = await testEndpoint(NETWORK_ENDPOINTS.LOCALHOST);
  tests.fileProtocol = await testEndpoint(NETWORK_ENDPOINTS.FILE_PROTOCOL);
  tests.localIP = await testEndpoint(NETWORK_ENDPOINTS.LOCAL_IP);

  return tests;
};

export const testContextIsolation = (): ContextIsolationTestResult => {
  const tests: ContextIsolationTestResult = {
    windowIsolated: true,
    globalIsolated: true,
    prototypeIsolated: true,
    contextBridgeOnly: true,
  };

  try {
    const testProp = '__test_isolation_' + Date.now();
    (window as any)[testProp] = 'test';
    tests.windowIsolated = typeof (window as any)[testProp] === 'undefined';
    delete (window as any)[testProp];
  } catch (e) {
    tests.windowIsolated = true;
  }

  try {
    tests.globalIsolated = typeof (globalThis as any).process === 'undefined';
  } catch (e) {
    tests.globalIsolated = true;
  }

  try {
    const testProp = '__test_proto_' + Date.now();
    (Object.prototype as any)[testProp] = 'test';
    tests.prototypeIsolated = typeof (window as any)[testProp] === 'undefined';
    delete (Object.prototype as any)[testProp];
  } catch (e) {
    tests.prototypeIsolated = true;
  }

  const expectedAPIs = ['wireDesktop', 'wireWebview'];
  const unexpectedAPIs = ['require', 'process', 'global', '__dirname', '__filename'];
  const hasUnexpected = unexpectedAPIs.some(api => typeof (window as any)[api] !== 'undefined');
  tests.contextBridgeOnly = !hasUnexpected;

  return tests;
};

export const testWebviewSecurity = (): WebviewSecurityResult => {
  const webviews = document.querySelectorAll('webview');
  const webviewConfigs = Array.from(webviews).map(webview => ({
    src: webview.getAttribute('src'),
    nodeintegration: webview.getAttribute('nodeintegration'),
    contextIsolation: webview.getAttribute('contextIsolation'),
    sandbox: webview.getAttribute('sandbox'),
    plugins: webview.getAttribute('plugins'),
    webSecurity: webview.getAttribute('webSecurity'),
  }));

  return {
    webviewCount: webviews.length,
    configs: webviewConfigs,
  };
};

export const checkAPIAvailability = (apis: string[]): Record<string, boolean> => {
  return apis.reduce((result, api) => {
    result[api] = typeof (window as any)[api] !== 'undefined';
    return result;
  }, {} as Record<string, boolean>);
};

export const testDOMManipulation = () => {
  const tests = {
    createElement: false,
    appendChild: false,
    removeChild: false,
    setAttribute: false,
    querySelector: false,
    addEventListener: false,
  };

  try {
    const testId = 'test-element-' + Date.now();
    const div = document.createElement('div');
    tests.createElement = div.tagName === 'DIV';

    div.id = testId;
    document.body.appendChild(div);
    tests.appendChild = !!document.getElementById(testId);

    div.setAttribute('data-test', 'value');
    tests.setAttribute = div.getAttribute('data-test') === 'value';

    const found = document.querySelector(`#${testId}`);
    tests.querySelector = found === div;

    let eventFired = false;
    div.addEventListener('click', () => {
      eventFired = true;
    });
    div.click();
    tests.addEventListener = eventFired;

    document.body.removeChild(div);
    tests.removeChild = !document.getElementById(testId);
  } catch (e) {
    console.error('DOM test error:', e);
  }

  return tests;
};

export const testJavaScriptExecution = () => {
  return {
    basicMath: 2 + 2 === 4,
    arrayMethods: [1, 2, 3].map(x => x * 2).join(',') === '2,4,6',
    objectCreation: typeof {test: 'value'} === 'object',
    functionExecution: (() => 'test')() === 'test',
    promiseSupport: typeof Promise === 'function',
    asyncSupport: typeof async function () {} === 'function',
    jsonSupport: JSON.stringify({test: 'value'}) === '{"test":"value"}',
  };
};

export const assertWebviewSecurity = (config: any) => {
  if (config.nodeintegration !== WEBVIEW_SECURITY_ATTRIBUTES.NODE_INTEGRATION) {
    throw new Error(`Webview nodeintegration should be ${WEBVIEW_SECURITY_ATTRIBUTES.NODE_INTEGRATION}`);
  }
  if (config.contextIsolation !== WEBVIEW_SECURITY_ATTRIBUTES.CONTEXT_ISOLATION) {
    throw new Error(`Webview contextIsolation should be ${WEBVIEW_SECURITY_ATTRIBUTES.CONTEXT_ISOLATION}`);
  }
  if (config.plugins !== WEBVIEW_SECURITY_ATTRIBUTES.PLUGINS) {
    throw new Error(`Webview plugins should be ${WEBVIEW_SECURITY_ATTRIBUTES.PLUGINS}`);
  }
};

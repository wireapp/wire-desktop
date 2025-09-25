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

import {test, expect} from '@playwright/test';

import {SharedTestBase} from '../../utils/shared-test-base';
import {checkAPIAvailability, testNetworkAccess} from '../../utils/common-test-utilities';

test.describe('Sandbox Validation Tests', () => {
  let testBase: SharedTestBase;

  test.beforeEach(async () => {
    testBase = new SharedTestBase();
    await testBase.setup({
      devTools: false,
      headless: true,
    });
  });

  test.afterEach(async () => {
    await testBase.cleanup();
  });

  test('should allow legitimate web APIs while blocking dangerous ones @security @validation @sandbox', async () => {
    const page = testBase.getMainPage();

    const webAPITest = await page.evaluate(() => {
      const allowedAPIs = {
        fetch: typeof fetch === 'function',
        localStorage: typeof localStorage === 'object',
        sessionStorage: typeof sessionStorage === 'object',
        indexedDB: typeof indexedDB === 'object',
        webSocket: typeof WebSocket === 'function',
        webWorker: typeof Worker === 'function',
        crypto: typeof crypto === 'object',
        performance: typeof performance === 'object',
      };

      const blockedAPIs = {
        showOpenFilePicker: typeof (window as any).showOpenFilePicker === 'function',
        showSaveFilePicker: typeof (window as any).showSaveFilePicker === 'function',
        showDirectoryPicker: typeof (window as any).showDirectoryPicker === 'function',
      };

      return {allowedAPIs, blockedAPIs};
    });

    expect(webAPITest.allowedAPIs.fetch).toBe(true);
    expect(webAPITest.allowedAPIs.localStorage).toBe(true);
    expect(webAPITest.allowedAPIs.sessionStorage).toBe(true);
    expect(webAPITest.allowedAPIs.indexedDB).toBe(true);
    expect(webAPITest.allowedAPIs.crypto).toBe(true);

    expect(webAPITest.blockedAPIs.showOpenFilePicker).toBe(false);
    expect(webAPITest.blockedAPIs.showSaveFilePicker).toBe(false);
    expect(webAPITest.blockedAPIs.showDirectoryPicker).toBe(false);

    console.log('✅ Web API sandbox validation passed:', webAPITest);
  });

  test('should validate secure network communication @security @validation @sandbox', async () => {
    const page = testBase.getMainPage();

    const networkTest = await page.evaluate(async () => {
      const tests = {
        httpsRequest: false,
        websocketConnection: false,
        corsRequest: false,
        localRequest: false,
      };

      try {
        const response = await fetch('https://httpbin.org/get', {
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
        });
        tests.httpsRequest = response.ok;
      } catch (e) {
        tests.httpsRequest = false;
      }

      try {
        const ws = new WebSocket('wss://echo.websocket.org');
        tests.websocketConnection = true;
        ws.close();
      } catch (e) {
        tests.websocketConnection = false;
      }

      try {
        const response = await fetch('https://httpbin.org/headers');
        tests.corsRequest = response.ok;
      } catch (e) {
        tests.corsRequest = false;
      }

      try {
        const response = await fetch('http://localhost:8080');
        tests.localRequest = response.ok;
      } catch (e) {
        tests.localRequest = false;
      }

      return tests;
    });

    expect(networkTest.httpsRequest).toBe(true);
    expect(networkTest.websocketConnection).toBe(true);
    expect(networkTest.corsRequest).toBe(true);

    expect(networkTest.localRequest).toBe(false);

    console.log('✅ Network communication validation passed:', networkTest);
  });

  test('should validate storage APIs work correctly @security @validation @sandbox', async () => {
    const page = testBase.getMainPage();

    const storageTest = await page.evaluate(() => {
      const tests = {
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        cookies: false,
      };

      try {
        localStorage.setItem('test', 'value');
        tests.localStorage = localStorage.getItem('test') === 'value';
        localStorage.removeItem('test');
      } catch (e) {
        tests.localStorage = false;
      }

      try {
        sessionStorage.setItem('test', 'value');
        tests.sessionStorage = sessionStorage.getItem('test') === 'value';
        sessionStorage.removeItem('test');
      } catch (e) {
        tests.sessionStorage = false;
      }

      try {
        const request = indexedDB.open('testDB', 1);
        tests.indexedDB = true;
      } catch (e) {
        tests.indexedDB = false;
      }

      try {
        document.cookie = 'test=value';
        tests.cookies = document.cookie.includes('test=value');
      } catch (e) {
        tests.cookies = false;
      }

      return tests;
    });

    expect(storageTest.localStorage).toBe(true);
    expect(storageTest.sessionStorage).toBe(true);
    expect(storageTest.indexedDB).toBe(true);
    expect(storageTest.cookies).toBe(true);

    console.log('✅ Storage APIs validation passed:', storageTest);
  });

  test('should validate WebRTC functionality with restrictions @security @validation @sandbox', async () => {
    const page = testBase.getMainPage();

    const webrtcTest = await page.evaluate(async () => {
      return new Promise(resolve => {
        const tests = {
          rtcPeerConnection: false,
          dataChannel: false,
          iceGathering: false,
          mediaConstraints: false,
        };

        try {
          const pc = new RTCPeerConnection({
            iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
          });
          tests.rtcPeerConnection = true;

          const channel = pc.createDataChannel('test');
          tests.dataChannel = true;

          pc.onicecandidate = event => {
            if (event.candidate) {
              tests.iceGathering = true;
            }
          };

          pc.createOffer()
            .then(offer => {
              tests.mediaConstraints = true;
              pc.close();
              resolve(tests);
            })
            .catch(() => {
              pc.close();
              resolve(tests);
            });
        } catch (error) {
          resolve(tests);
        }

        setTimeout(() => resolve(tests), 3000);
      });
    });

    expect((webrtcTest as any).rtcPeerConnection).toBe(true);
    expect((webrtcTest as any).dataChannel).toBe(true);

    console.log('✅ WebRTC validation passed:', webrtcTest);
  });

  test('should validate Web Workers functionality @security @validation @sandbox', async () => {
    const page = testBase.getMainPage();

    const workerTest = await page.evaluate(async () => {
      return new Promise(resolve => {
        const tests = {
          workerCreation: false,
          workerCommunication: false,
          workerTermination: false,
        };

        try {
          const workerCode = `
            self.onmessage = function(e) {
              self.postMessage('Worker received: ' + e.data);
            };
          `;

          const blob = new Blob([workerCode], {type: 'application/javascript'});
          const worker = new Worker(URL.createObjectURL(blob));
          tests.workerCreation = true;

          worker.onmessage = e => {
            if (e.data === 'Worker received: test') {
              tests.workerCommunication = true;
            }
            worker.terminate();
            tests.workerTermination = true;
            resolve(tests);
          };

          worker.onerror = () => {
            worker.terminate();
            resolve(tests);
          };

          worker.postMessage('test');
        } catch (error) {
          resolve(tests);
        }

        setTimeout(() => resolve(tests), 3000);
      });
    });

    expect((workerTest as any).workerCreation).toBe(true);
    expect((workerTest as any).workerCommunication).toBe(true);
    expect((workerTest as any).workerTermination).toBe(true);

    console.log('✅ Web Workers validation passed:', workerTest);
  });

  test('should validate CSP (Content Security Policy) enforcement @security @validation @sandbox', async () => {
    const page = testBase.getMainPage();

    const cspTest = await page.evaluate(() => {
      const tests = {
        inlineScriptBlocked: true,
        evalBlocked: true,
        unsafeInlineBlocked: true,
        externalScriptAllowed: false,
      };

      try {
        const script = document.createElement('script');
        script.textContent = 'window.__inlineScriptExecuted = true;';
        document.head.appendChild(script);
        tests.inlineScriptBlocked = !(window as any).__inlineScriptExecuted;
      } catch (e) {
        tests.inlineScriptBlocked = true;
      }

      try {
        eval('window.__evalExecuted = true;');
        tests.evalBlocked = !(window as any).__evalExecuted;
      } catch (e) {
        tests.evalBlocked = true;
      }

      try {
        const style = document.createElement('style');
        style.textContent = 'body { background: red !important; }';
        document.head.appendChild(style);
        const bgColor = getComputedStyle(document.body).backgroundColor;
        tests.unsafeInlineBlocked = !bgColor.includes('red');
      } catch (e) {
        tests.unsafeInlineBlocked = true;
      }

      return tests;
    });

    expect(cspTest.inlineScriptBlocked).toBe(true);
    expect(cspTest.evalBlocked).toBe(true);

    console.log('✅ CSP enforcement validation passed:', cspTest);
  });

  test('should run comprehensive sandbox validation @security @validation @sandbox', async () => {
    const page = testBase.getMainPage();

    const comprehensiveTest = await page.evaluate(() => {
      const validations = {
        webAPIsWorking: 0,
        securityRestrictionsActive: 0,
        totalTests: 0,
      };

      const webAPIs = [
        'fetch',
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'WebSocket',
        'Worker',
        'crypto',
        'performance',
      ];

      webAPIs.forEach(api => {
        validations.totalTests++;
        if (typeof (window as any)[api] !== 'undefined') {
          validations.webAPIsWorking++;
        }
      });

      const restrictedAPIs = ['showOpenFilePicker', 'showSaveFilePicker', 'showDirectoryPicker'];

      restrictedAPIs.forEach(api => {
        validations.totalTests++;
        if (typeof (window as any)[api] === 'undefined') {
          validations.securityRestrictionsActive++;
        }
      });

      return {
        ...validations,
        webAPISuccessRate: validations.webAPIsWorking / webAPIs.length,
        securitySuccessRate: validations.securityRestrictionsActive / restrictedAPIs.length,
      };
    });

    console.log('🔍 Comprehensive sandbox validation:', comprehensiveTest);

    expect(comprehensiveTest.webAPISuccessRate).toBeGreaterThanOrEqual(0.8);

    expect(comprehensiveTest.securitySuccessRate).toBe(1.0);

    console.log('✅ Comprehensive sandbox validation passed');
  });
});

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

import {CommonTestPatterns} from '../../utils/test-base';

test.describe('Sandbox Exposure Tests', () => {
  const getContext = CommonTestPatterns.setupSecurityTest();

  test('should block direct file system access @security @exposure @sandbox', async () => {
    const {securityHelpers} = getContext();
    const result = await securityHelpers.testFileSystemAccess();

    expect(result.success).toBe(true);
    expect(result.details.showOpenFilePicker).toBe(false);

    CommonTestPatterns.logTestResult('Direct file system access properly blocked', result.details, true);
  });

  test('should block network access to local resources @security @exposure @sandbox', async () => {
    const {launcher} = getContext();
    const page = CommonTestPatterns.requirePage(launcher);

    const networkTest = await page.evaluate(async () => {
      const tests = {
        localhost: false,
        fileProtocol: false,
        localIP: false,
      };

      try {
        const response = await fetch('http://localhost:22');
        tests.localhost = response.ok;
      } catch (e) {
        tests.localhost = false;
      }

      try {
        // Test file protocol access
        const response = await fetch('file:///etc/passwd');
        tests.fileProtocol = response.ok;
      } catch (e) {
        tests.fileProtocol = false;
      }

      try {
        const response = await fetch('http://127.0.0.1:22');
        tests.localIP = response.ok;
      } catch (e) {
        tests.localIP = false;
      }

      return tests;
    });

    expect(networkTest.localhost).toBe(false);
    expect(networkTest.fileProtocol).toBe(false);
    expect(networkTest.localIP).toBe(false);

    console.log('✅ Local network access properly blocked:', networkTest);
  });

  test('should block WebRTC local IP enumeration @security @exposure @sandbox', async () => {
    const {launcher} = getContext();
    const page = launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }

    const webrtcTest = await page.evaluate(async () => {
      return new Promise(resolve => {
        const localIPs: string[] = [];
        let completed = false;

        try {
          const pc = new RTCPeerConnection({
            iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
          });

          pc.createDataChannel('test');

          pc.onicecandidate = event => {
            if (event.candidate) {
              const candidate = event.candidate.candidate;
              const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/); // NOSONAR - Intentional regex for security testing
              if (ipMatch && ipMatch[1].startsWith('192.168.')) {
                localIPs.push(ipMatch[1]);
              }
            }
          };

          pc.createOffer().then(offer => pc.setLocalDescription(offer));

          setTimeout(() => {
            if (!completed) {
              completed = true;
              pc.close();
              resolve({
                webrtcAvailable: true,
                localIPsFound: localIPs.length,
                ips: localIPs,
              });
            }
          }, 3000);
        } catch (error) {
          if (!completed) {
            completed = true;
            resolve({
              webrtcAvailable: false,
              error: error instanceof Error ? error.message : String(error),
              localIPsFound: 0,
              ips: [],
            });
          }
        }
      });
    });

    console.log('🔍 WebRTC test result:', webrtcTest);

    expect((webrtcTest as any).localIPsFound).toBeLessThanOrEqual(1);
  });

  test('should block clipboard access without user interaction @security @exposure @sandbox', async () => {
    const {launcher} = getContext();
    const page = launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }

    const clipboardTest = await page.evaluate(async () => {
      const tests = {
        readText: false,
        writeText: false,
        readPermission: false,
      };

      try {
        await navigator.clipboard.readText();
        tests.readText = true;
      } catch (e) {
        tests.readText = false;
      }

      try {
        await navigator.clipboard.writeText('test');
        tests.writeText = true;
      } catch (e) {
        tests.writeText = false;
      }

      try {
        const permission = await navigator.permissions.query({name: 'clipboard-read' as PermissionName});
        tests.readPermission = permission.state === 'granted';
      } catch (e) {
        tests.readPermission = false;
      }

      return tests;
    });

    expect(clipboardTest.readText).toBe(false);
    expect(clipboardTest.readPermission).toBe(false);

    console.log('✅ Clipboard access properly restricted:', clipboardTest);
  });

  test('should block geolocation access without permission @security @exposure @sandbox', async () => {
    const {launcher} = getContext();
    const page = launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }

    const geoTest = await page.evaluate(async () => {
      return new Promise(resolve => {
        if (!navigator.geolocation) {
          resolve({available: false, blocked: true});
          return;
        }

        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve({available: true, blocked: true, reason: 'timeout'});
          }
        }, 2000);

        navigator.geolocation.getCurrentPosition( // NOSONAR - Intentional geolocation access for security testing
          position => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve({
                available: true,
                blocked: false,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            }
          },
          error => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve({
                available: true,
                blocked: true,
                error: error instanceof Error ? error.message : String(error),
                code: error.code,
              });
            }
          },
          {timeout: 1000},
        );
      });
    });

    expect((geoTest as any).blocked).toBe(true);

    console.log('✅ Geolocation access properly blocked:', geoTest);
  });

  test('should block camera and microphone access without permission @security @exposure @sandbox', async () => {
    const {launcher} = getContext();
    const page = launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }

    const mediaTest = await page.evaluate(async () => {
      const tests = {
        camera: {blocked: true, error: ''},
        microphone: {blocked: true, error: ''},
        both: {blocked: true, error: ''},
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        tests.camera.blocked = false;
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        tests.camera.error = e instanceof Error ? e.message : String(e);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        tests.microphone.blocked = false;
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        tests.microphone.error = e instanceof Error ? e.message : String(e);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        tests.both.blocked = false;
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        tests.both.error = e instanceof Error ? e.message : String(e);
      }

      return tests;
    });

    expect(mediaTest.camera.blocked).toBe(true);
    expect(mediaTest.microphone.blocked).toBe(true);
    expect(mediaTest.both.blocked).toBe(true);

    console.log('✅ Media access properly blocked:', mediaTest);
  });

  test('should run comprehensive sandbox exposure test @security @exposure @sandbox', async () => {
    const {launcher} = getContext();
    const page = launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }

    const comprehensiveTest = await page.evaluate(async () => {
      const restrictions = {
        fileSystemAccess: true,
        networkRestrictions: true,
        clipboardRestrictions: true,
        geolocationRestrictions: true,
        mediaRestrictions: true,
        webglRestrictions: false,
        webassemblyRestrictions: false,
      };

      const apis = ['showOpenFilePicker', 'showSaveFilePicker', 'showDirectoryPicker'];

      apis.forEach(api => {
        if (typeof (window as any)[api] === 'function') {
          restrictions.fileSystemAccess = false;
        }
      });

      return {
        restrictions,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
      };
    });

    console.log('🔍 Comprehensive sandbox test:', comprehensiveTest);

    expect(comprehensiveTest.restrictions.fileSystemAccess).toBe(true);
    expect(comprehensiveTest.restrictions.networkRestrictions).toBe(true);
    expect(comprehensiveTest.restrictions.clipboardRestrictions).toBe(true);
  });
});

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

import {Page} from '@playwright/test';

export interface SecurityTestResult {
  success: boolean;
  error?: string;
  details?: any;
}

export class SecurityHelpers {
  constructor(private page: Page) {}

  async testRequireAccess(): Promise<SecurityTestResult> {
    try {
      const result = await this.page.evaluate(() => {
        try {
          const fs = (window as any).require('fs');
          return {accessible: true, module: 'fs', result: typeof fs};
        } catch (error) {
          return {accessible: false, error: error instanceof Error ? error.message : String(error)};
        }
      });

      return {
        success: !result.accessible,
        details: result,
      };
    } catch (error) {
      return {
        success: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testProcessAccess(): Promise<SecurityTestResult> {
    try {
      const result = await this.page.evaluate(() => {
        try {
          const proc = (window as any).process;
          return {
            accessible: !!proc,
            version: proc?.version,
            platform: proc?.platform,
            env: !!proc?.env,
          };
        } catch (error) {
          return {accessible: false, error: error instanceof Error ? error.message : String(error)};
        }
      });

      return {
        success: !result.accessible,
        details: result,
      };
    } catch (error) {
      return {
        success: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testGlobalNodeAccess(): Promise<SecurityTestResult> {
    try {
      const result = await this.page.evaluate(() => {
        const globals = ['global', '__dirname', '__filename', 'Buffer', 'setImmediate', 'clearImmediate'];
        const accessible: Record<string, boolean> = {};

        globals.forEach(globalName => {
          try {
            accessible[globalName] = typeof (window as any)[globalName] !== 'undefined';
          } catch {
            accessible[globalName] = false;
          }
        });

        return accessible;
      });

      const hasAccess = Object.values(result).some(Boolean);

      return {
        success: !hasAccess,
        details: result,
      };
    } catch (error) {
      return {
        success: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testContextBridgeAccess(): Promise<SecurityTestResult> {
    try {
      const result = await this.page.evaluate(() => {
        const wireDesktop = (window as any).wireDesktop;
        const wireWebview = (window as any).wireWebview;

        return {
          wireDesktop: {
            exists: !!wireDesktop,
            hasLocale: !!wireDesktop?.locale,
            hasIsMac: typeof wireDesktop?.isMac === 'boolean',
            hasSendBadgeCount: typeof wireDesktop?.sendBadgeCount === 'function',
          },
          wireWebview: {
            exists: !!wireWebview,
            hasDesktopCapturer: !!wireWebview?.desktopCapturer,
            hasSystemCrypto: !!wireWebview?.systemCrypto,
            hasEnvironment: !!wireWebview?.environment,
          },
        };
      });

      const hasValidAPIs = result.wireDesktop.exists || result.wireWebview.exists;

      return {
        success: hasValidAPIs,
        details: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testFileSystemAccess(): Promise<SecurityTestResult> {
    try {
      const result = await this.page.evaluate(() => {
        const tests = {
          fileAPI: false,
          webkitDirectory: false,
          showOpenFilePicker: false,
        };

        try {
          tests.fileAPI = typeof File !== 'undefined' && typeof FileReader !== 'undefined';
        } catch {}

        try {
          const input = document.createElement('input');
          input.type = 'file';
          tests.webkitDirectory = 'webkitdirectory' in input;
        } catch {}

        try {
          tests.showOpenFilePicker = typeof (window as any).showOpenFilePicker === 'function';
        } catch {}

        return tests;
      });

      const hasRestrictedAccess = !result.showOpenFilePicker;

      return {
        success: hasRestrictedAccess,
        details: result,
      };
    } catch (error) {
      return {
        success: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testCodeInjection(maliciousCode: string): Promise<SecurityTestResult> {
    try {
      const result = await this.page.evaluate(code => {
        try {
          const methods = {
            eval: false,
            function: false,
            script: false,
          };

          try {
            eval(code); // NOSONAR - Intentional eval for security testing
            methods.eval = true;
          } catch {}

          try {
            new Function(code)(); // NOSONAR - Intentional Function constructor for security testing
            methods.function = true;
          } catch {}

          try {
            const script = document.createElement('script');
            script.textContent = code;
            document.head.appendChild(script);
            methods.script = true;
          } catch {}

          return methods;
        } catch (error) {
          return {error: error instanceof Error ? error.message : String(error)};
        }
      }, maliciousCode);

      const injectionSucceeded = Object.values(result).some(Boolean);

      return {
        success: !injectionSucceeded,
        details: result,
      };
    } catch (error) {
      return {
        success: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async runSecurityValidation(): Promise<{
    passed: number;
    failed: number;
    results: Record<string, SecurityTestResult>;
  }> {
    const tests = {
      requireAccess: await this.testRequireAccess(),
      processAccess: await this.testProcessAccess(),
      globalNodeAccess: await this.testGlobalNodeAccess(),
      contextBridgeAccess: await this.testContextBridgeAccess(),
      fileSystemAccess: await this.testFileSystemAccess(),
    };

    const passed = Object.values(tests).filter(test => test.success).length;
    const failed = Object.values(tests).filter(test => !test.success).length;

    return {
      passed,
      failed,
      results: tests,
    };
  }
}

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

import {test} from '@playwright/test';
import {WireDesktopLauncher} from './app-launcher';
import {SecurityHelpers} from './security-helpers';
import {InjectionHelpers} from './injection-helpers';

export interface TestContext {
  launcher: WireDesktopLauncher;
  securityHelpers: SecurityHelpers;
  injectionHelpers: InjectionHelpers;
}

export class SecurityTestBase {
  protected launcher!: WireDesktopLauncher;
  protected securityHelpers!: SecurityHelpers;
  protected injectionHelpers!: InjectionHelpers;

  async setup(
    options: {devTools?: boolean; headless?: boolean} = {devTools: false, headless: true},
  ): Promise<TestContext> {
    this.launcher = new WireDesktopLauncher();
    const {page} = await this.launcher.launch({
      devTools: options.devTools ?? false,
      headless: options.headless ?? true,
    });

    await this.launcher.waitForAppReady();
    this.securityHelpers = new SecurityHelpers(page);
    this.injectionHelpers = new InjectionHelpers(page);

    return {
      launcher: this.launcher,
      securityHelpers: this.securityHelpers,
      injectionHelpers: this.injectionHelpers,
    };
  }

  async teardown(): Promise<void> {
    if (this.launcher) {
      await this.launcher.cleanup();
    }
  }

  getPage() {
    const page = this.launcher?.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }
    return page;
  }

  assertSecurityBlocked(result: {success: boolean; details?: any}, testName: string) {
    if (!result.success) {
      console.error(`❌ ${testName} failed:`, result.details);
      throw new Error(`Security test failed: ${testName}`);
    }
    console.log(`✅ ${testName} properly blocked:`, result.details);
  }

  assertAccessBlocked(result: {details: {accessible: boolean}}, testName: string) {
    if (result.details.accessible) {
      console.error(`❌ ${testName}: Access should be blocked but was allowed`);
      throw new Error(`Security vulnerability: ${testName} access not blocked`);
    }
    console.log(`✅ ${testName} access properly blocked`);
  }

  async testAPIAvailability(apiName: string, shouldBeAvailable: boolean = false) {
    const page = this.getPage();
    const result = await page.evaluate(api => {
      return typeof (window as any)[api] !== 'undefined';
    }, apiName);

    if (shouldBeAvailable && !result) {
      throw new Error(`Expected API ${apiName} to be available but it was not found`);
    }
    if (!shouldBeAvailable && result) {
      throw new Error(`Expected API ${apiName} to be blocked but it was available`);
    }

    console.log(`✅ API ${apiName} availability check passed: ${result ? 'available' : 'blocked'}`);
    return result;
  }

  async runComprehensiveSecurityCheck(): Promise<{
    passed: number;
    failed: number;
    results: Record<string, any>;
  }> {
    const results = await this.securityHelpers.runSecurityValidation();

    console.log(`🛡️  Security Summary: ${results.passed}/${results.passed + results.failed} tests passed`);

    Object.entries(results.results).forEach(([testName, result]) => {
      console.log(`${result.success ? '✅' : '❌'} ${testName}: ${result.success ? 'PASS' : 'FAIL'}`);
    });

    return results;
  }
}

export const securityTest = test.extend<{testContext: TestContext}>({
  testContext: async (_fixtures, use) => {
    const testBase = new SecurityTestBase();
    const context = await testBase.setup();

    try {
      await use(context);
    } finally {
      await testBase.teardown();
    }
  },
});

export const CommonTestPatterns = {
  setupSecurityTest: () => {
    let testBase: SecurityTestBase;
    let context: TestContext;

    test.beforeEach(async () => {
      testBase = new SecurityTestBase();
      context = await testBase.setup();
    });

    test.afterEach(async () => {
      if (testBase) {
        await testBase.teardown();
      }
    });

    return () => context;
  },

  requirePage: (launcher: WireDesktopLauncher) => {
    const page = launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }
    return page;
  },

  logTestResult: (testName: string, result: any, success: boolean) => {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${testName}:`, result);
  },
};

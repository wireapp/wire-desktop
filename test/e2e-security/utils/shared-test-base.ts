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

import {test} from '@playwright/test';
import {WireDesktopLauncher} from './app-launcher';

export class SharedTestBase {
  public launcher: WireDesktopLauncher;

  constructor() {
    this.launcher = new WireDesktopLauncher();
  }

  async setup(options: {devTools?: boolean; headless?: boolean} = {}) {
    const {page} = await this.launcher.launch({
      devTools: options.devTools ?? false,
      headless: options.headless ?? true,
    });

    await this.launcher.waitForAppReady();
    return {page, launcher: this.launcher};
  }

  async cleanup() {
    await this.launcher.cleanup();
  }

  getMainPage() {
    const page = this.launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }
    return page;
  }

  async waitForAppReady(timeout: number = 15000) {
    await this.launcher.waitForAppReady();
    const page = this.getMainPage();
    await page.waitForTimeout(timeout);
  }
}

export class CommonTestPatterns {
  static setupSecurityTest() {
    let testBase: SharedTestBase;

    const setup = () => {
      testBase = new SharedTestBase();
      return testBase;
    };

    const getContext = () => {
      if (!testBase) {
        throw new Error('Test not properly initialized. Call setup() first.');
      }
      return {
        launcher: testBase.launcher,
        securityHelpers: testBase,
      };
    };

    return getContext;
  }

  static requirePage(launcher: WireDesktopLauncher) {
    const page = launcher.getMainPage();
    if (!page) {
      throw new Error('Page not available');
    }
    return page;
  }

  static logTestResult(testName: string, details: any, success: boolean) {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${testName}:`, details);
  }

  static createBeforeEach(options: {devTools?: boolean; headless?: boolean} = {}) {
    return async function (this: {testBase: SharedTestBase}) {
      this.testBase = new SharedTestBase();
      await this.testBase.setup(options);
    };
  }

  static createAfterEach() {
    return async function (this: {testBase: SharedTestBase}) {
      if (this.testBase) {
        await this.testBase.cleanup();
      }
    };
  }
}

export class AuthTestPatterns {
  static async testLoginInterface(page: any) {
    return await page.evaluate(() => {
      const elements = {
        loginForm: !!document.querySelector('[data-uie-name*="login"], form, .login'),
        emailInput: !!document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email"]'),
        passwordInput: !!document.querySelector('input[type="password"], input[name="password"]'),
        submitButton: !!document.querySelector('button[type="submit"], button[data-uie-name*="login"], .login-button'),
        ssoOption: !!document.querySelector('[data-uie-name*="sso"], .sso, [href*="sso"]'),
        signupOption: !!document.querySelector('[data-uie-name*="signup"], .signup, [href*="signup"]'),
      };
      return elements;
    });
  }

  static async testSSOElements(page: any) {
    return await page.evaluate(() => {
      const tests = {
        ssoElementFound: false,
        ssoClickable: false,
        ssoUrlPattern: false,
      };

      const ssoElements = document.querySelectorAll('[data-uie-name*="sso"], .sso, [href*="sso"]');
      tests.ssoElementFound = ssoElements.length > 0;

      if (ssoElements.length > 0) {
        const ssoElement = ssoElements[0] as HTMLElement;
        tests.ssoClickable = !ssoElement.hasAttribute('disabled');

        const href = ssoElement.getAttribute('href') || '';
        tests.ssoUrlPattern = href.includes('sso') || href.includes('login');
      }

      return tests;
    });
  }

  static async testSAMLElements(page: any) {
    return await page.evaluate(() => {
      const tests = {
        samlElementFound: false,
        samlFormFound: false,
        samlInputFound: false,
      };

      const samlElements = document.querySelectorAll('[data-uie-name*="saml"], .saml, [href*="saml"]');
      tests.samlElementFound = samlElements.length > 0;

      const samlForms = document.querySelectorAll('form[action*="saml"], .saml-form');
      tests.samlFormFound = samlForms.length > 0;

      const samlInputs = document.querySelectorAll('input[name*="saml"], input[data-uie-name*="saml"]');
      tests.samlInputFound = samlInputs.length > 0;

      return tests;
    });
  }

  static async testOAuthElements(page: any) {
    return await page.evaluate(() => {
      const tests = {
        oauthElementFound: false,
        oauthButtonFound: false,
        oauthProviderFound: false,
      };

      const oauthElements = document.querySelectorAll('[data-uie-name*="oauth"], .oauth, [href*="oauth"]');
      tests.oauthElementFound = oauthElements.length > 0;

      const oauthButtons = document.querySelectorAll('button[data-uie-name*="oauth"], .oauth-button');
      tests.oauthButtonFound = oauthButtons.length > 0;

      const providerElements = document.querySelectorAll(
        '[data-uie-name*="google"], [data-uie-name*="microsoft"], .provider',
      );
      tests.oauthProviderFound = providerElements.length > 0;

      return tests;
    });
  }

  static async testFormValidation(page: any) {
    return await page.evaluate(() => {
      const tests = {
        inputsFound: false,
        inputsInteractive: false,
        validationWorking: false,
        formSubmittable: false,
      };

      const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
      tests.inputsFound = inputs.length > 0;

      if (inputs.length > 0) {
        const firstInput = inputs[0] as HTMLInputElement;
        tests.inputsInteractive = !firstInput.disabled && !firstInput.readOnly;

        try {
          const originalValue = firstInput.value;
          const testValue = 'test@example.com';
          firstInput.value = testValue;
          tests.validationWorking = firstInput.value === testValue;
          firstInput.value = originalValue;
        } catch (e) {
          tests.validationWorking = false;
        }
      }

      const submitButtons = document.querySelectorAll(
        'button[type="submit"], .submit-button, [data-uie-name*="submit"]',
      );
      tests.formSubmittable = submitButtons.length > 0;

      return tests;
    });
  }
}

export class AppFunctionalityPatterns {
  static async testAppStructure(page: any) {
    return await page.evaluate(() => {
      return {
        hasWireApp: !!document.querySelector('[data-uie-name="wire-app"]'),
        hasBody: !!document.body,
        hasHead: !!document.head,
        title: document.title,
        readyState: document.readyState,
      };
    });
  }

  static async testUIElements(page: any) {
    return await page.evaluate(() => {
      const elements = {
        wireApp: !!document.querySelector('[data-uie-name="wire-app"]'),
        loginElements: document.querySelectorAll('[data-uie-name*="login"]').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        images: document.querySelectorAll('img').length,
        styles: document.querySelectorAll('style, link[rel="stylesheet"]').length,
      };
      return elements;
    });
  }
}

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

import {_electron as electron, ElectronApplication, Page} from '@playwright/test';

import * as fs from 'fs';
import * as path from 'path';

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('[AppLauncher] Unhandled Rejection at:', promise, 'reason:', reason);
});

export interface AppLaunchOptions {
  args?: string[];

  env?: Record<string, string>;

  devTools?: boolean;

  timeout?: number;

  headless?: boolean;
}

export class WireDesktopLauncher {
  private app: ElectronApplication | null = null;
  private mainPage: Page | null = null;

  async launch(options: AppLaunchOptions = {}): Promise<{app: ElectronApplication; page: Page}> {
    const {args = [], env = {}, devTools = false, timeout = 30000, headless = true} = options;

    const projectRoot = path.join(process.cwd(), '../..');

    let electronPath: string;
    const electronDir = path.join(projectRoot, 'node_modules/electron/dist');

    switch (process.platform) {
      case 'darwin':
        electronPath = path.join(electronDir, 'Electron.app/Contents/MacOS/Electron');
        break;
      case 'win32':
        electronPath = path.join(electronDir, 'electron.exe');
        break;
      case 'linux':
        electronPath = path.join(electronDir, 'electron');
        break;
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }

    const appPath = projectRoot;

    const defaultArgs = [appPath, '--disable-features=VizDisplayCompositor', '--enable-logging', '--log-level=0'];

    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      defaultArgs.push(
        // NOTE: Removed --headless because we use xvfb-run which provides a virtual display
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-zygote',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-translate',
        '--disable-sync',
        '--disable-background-networking',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        // Use software rendering for CI environments
        '--use-gl=swiftshader',
        '--disable-ipc-flooding-protection',
        '--disable-gpu-sandbox',
      );
      console.log('CI environment detected, adding CI-specific flags (using xvfb-run for display)');
    }

    if (devTools) {
      defaultArgs.push('--devtools');
    }

    // Add --headless for local headless testing (CI headless is handled above)
    if (headless && !process.env.CI && !process.env.GITHUB_ACTIONS) {
      defaultArgs.push('--headless');
    }

    const finalArgs = [...defaultArgs, ...args];

    const testEnv = {
      NODE_ENV: 'test',
      WIRE_FORCE_EXTERNAL_AUTH: 'false',
      // Pass through CI environment variables
      ...(process.env.CI || process.env.GITHUB_ACTIONS ? {
        ELECTRON_DISABLE_SECURITY_WARNINGS: process.env.ELECTRON_DISABLE_SECURITY_WARNINGS || 'true',
        ELECTRON_DISABLE_GPU: process.env.ELECTRON_DISABLE_GPU || 'true',
        ELECTRON_NO_ATTACH_CONSOLE: process.env.ELECTRON_NO_ATTACH_CONSOLE || 'true',
      } : {}),
      ...env,
    };

    console.log('Launching Wire Desktop with args:', finalArgs);
    console.log('Platform:', process.platform);
    console.log('Electron path:', electronPath);
    console.log('App path:', appPath);
    console.log('Environment:', testEnv);

    // Additional CI debugging
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.log('CI Environment Debug:');
      console.log('- CI:', process.env.CI);
      console.log('- GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS);
      console.log('- Virtual display: provided by xvfb-run');
      console.log('- Current working directory:', process.cwd());
    }

    if (!fs.existsSync(electronPath)) {
      throw new Error(`Electron binary not found at: ${electronPath}`);
    }

    try {
      this.app = await electron.launch({
        executablePath: electronPath,
        args: finalArgs,
        env: testEnv,
        timeout,
      });

      await this.app.waitForEvent('window', {timeout});

      this.mainPage = await this.app.firstWindow();

      await this.mainPage.waitForLoadState('domcontentloaded', {timeout});

      console.log('Wire Desktop launched successfully');

      return {
        app: this.app,
        page: this.mainPage,
      };
    } catch (error) {
      console.error('Failed to launch Wire Desktop:', error);
      await this.cleanup();
      throw error;
    }
  }

  getMainPage(): Page | null {
    return this.mainPage;
  }

  getApp(): ElectronApplication | null {
    return this.app;
  }

  async waitForAppReady(timeout = 30000): Promise<void> {
    if (!this.mainPage) {
      throw new Error('App not launched');
    }

    const selectorTimeout = process.env.CI || process.env.GITHUB_ACTIONS ? 15000 : 5000;
    const loadStateTimeout = process.env.CI || process.env.GITHUB_ACTIONS ? 20000 : 10000;
    const finalWait = process.env.CI || process.env.GITHUB_ACTIONS ? 5000 : 2000;

    try {
      await this.mainPage.waitForSelector('[data-uie-name="wire-app"]', {timeout: selectorTimeout});
    } catch (e) {
      console.log('Wire app selector not found - this is expected in security testing mode');
    }

    await this.mainPage.waitForLoadState('domcontentloaded', {timeout: loadStateTimeout});

    await this.mainPage.waitForTimeout(finalWait);
  }

  async cleanup(): Promise<void> {
    try {
      if (this.app) {
        await this.app.close();
        this.app = null;
      }
      this.mainPage = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async restart(options: AppLaunchOptions = {}): Promise<{app: ElectronApplication; page: Page}> {
    await this.cleanup();
    return this.launch(options);
  }

  async getLogs(): Promise<string[]> {
    if (!this.app) {
      return [];
    }

    try {
      const logs: string[] = [];

      return logs;
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }
}

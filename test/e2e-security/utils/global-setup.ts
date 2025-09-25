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

import * as fs from 'fs';
import * as path from 'path';

async function setupCIEnvironment(): Promise<void> {
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.log('🔧 Setting up CI environment...');

    process.env.DISPLAY = process.env.DISPLAY || ':99';
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    process.env.ELECTRON_ENABLE_LOGGING = 'true';
    process.env.ELECTRON_DISABLE_GPU = 'true';
    process.env.ELECTRON_NO_ATTACH_CONSOLE = 'true';

    if (!process.env.HEADLESS) {
      process.env.HEADLESS = 'true';
    }

    process.env.NODE_ENV = 'test';
    process.env.WIRE_FORCE_EXTERNAL_AUTH = 'false';

    console.log('✅ CI environment configured with DISPLAY:', process.env.DISPLAY);
  }
}

async function globalSetup(): Promise<void> {
  console.log('🔧 Setting up Wire Desktop Security E2E Tests...');

  process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    if (process.env.CI) {
      process.exit(1);
    }
  });

  try {
    await setupCIEnvironment();

    await ensureTestDirectories();

    await verifyAppBuild();

    await setupTestEnvironment();

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function ensureTestDirectories(): Promise<void> {
  const directories = [
    'test-results',
    'security-test-report',
    'test/e2e-security/fixtures/malicious-scripts',
    'test/e2e-security/fixtures/test-data',
  ];

  for (const dir of directories) {
    const fullPath = path.join(__dirname, '../../../', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, {recursive: true});
      console.log(`📁 Created directory: ${dir}`);
    }
  }
}

async function verifyAppBuild(): Promise<void> {
  const requiredPaths = [
    'electron/dist/preload/preload-app.js',
    'electron/dist/preload/preload-webview.js',
    'electron/renderer/index.html',
  ];

  for (const requiredPath of requiredPaths) {
    const fullPath = path.join(__dirname, '../../../', requiredPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required file not found: ${requiredPath}. Please run 'yarn build:ts' first.`);
    }
  }

  console.log('✅ Electron app build verified');
}

async function setupTestEnvironment(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.WIRE_FORCE_EXTERNAL_AUTH = 'false';
  process.env.ELECTRON_ENABLE_LOGGING = 'true';

  const testConfig = {
    security: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    testing: {
      timeout: 30000,
      retries: 2,
      headless: true,
    },
  };

  const configPath = path.join(__dirname, '../fixtures/test-data/test-config.json');
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

  console.log('✅ Test environment configured');
}

export default globalSetup;

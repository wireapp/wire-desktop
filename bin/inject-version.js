#!/usr/bin/env node

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

const fs = require('node:fs');
const path = require('node:path');

/**
 * Inject version from wire.json into preload scripts at build time
 * 
 * This script replaces process.env.DESKTOP_VERSION with the actual version
 * from wire.json in the preload scripts before TypeScript compilation.
 * This is necessary because preload scripts cannot use webpack DefinePlugin
 * and need the version injected at build time for context isolation security.
 */

const WIRE_JSON_PATH = path.resolve(__dirname, '../electron/wire.json');
const PRELOAD_WEBVIEW_PATH = path.resolve(__dirname, '../electron/src/preload/preload-webview.ts');

function injectVersion() {
  try {
    const wireJson = JSON.parse(fs.readFileSync(WIRE_JSON_PATH, 'utf8'));
    const version = wireJson.version || 'unknown';
    
    console.log(`Injecting version ${version} into preload scripts...`);
    
    let preloadContent = fs.readFileSync(PRELOAD_WEBVIEW_PATH, 'utf8');
    
    const originalPattern = /process\.env\.DESKTOP_VERSION \|\| 'unknown'/g;
    const replacement = `'${version}'`;
    
    if (preloadContent.match(originalPattern)) {
      preloadContent = preloadContent.replaceAll(originalPattern, replacement);
      
      fs.writeFileSync(PRELOAD_WEBVIEW_PATH, preloadContent, 'utf8');
      console.log(`Successfully injected version ${version} into preload-webview.ts`);
    } else {
      console.log('No version injection pattern found in preload-webview.ts');
    }
    
  } catch (error) {
    console.error('Error injecting version:', error.message);
    process.exit(1);
  }
}

function restoreVersion() {
  try {
    console.log('Restoring original version pattern in preload scripts...');

    let preloadContent = fs.readFileSync(PRELOAD_WEBVIEW_PATH, 'utf8');

    const desktopVersionLine = /DESKTOP_VERSION: '[^']+'/g;

    if (preloadContent.match(desktopVersionLine)) {
      preloadContent = preloadContent.replaceAll(desktopVersionLine, "DESKTOP_VERSION: process.env.DESKTOP_VERSION || 'unknown'");

      fs.writeFileSync(PRELOAD_WEBVIEW_PATH, preloadContent, 'utf8');
      console.log('Successfully restored original version pattern in preload-webview.ts');
    } else {
      console.log('No hardcoded version found to restore in preload-webview.ts');
    }

  } catch (error) {
    console.error('Error restoring version:', error.message);
    process.exit(1);
  }
}

const command = process.argv[2];

if (command === 'restore') {
  restoreVersion();
} else {
  injectVersion();
}

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
 * Automated Event Type Synchronization
 * 
 * This script automatically synchronizes EVENT_TYPE constants from the main process
 * to preload scripts that cannot import them directly due to context isolation.
 * 
 * Source of truth: electron/src/lib/eventType.ts
 * Targets:
 * - electron/src/shared/contextIsolationConstants.ts
 * - electron/src/preload/preload-app.ts
 * - electron/src/preload/preload-webview.ts (if needed)
 */

const SOURCE_FILE = path.resolve(__dirname, '../electron/src/lib/eventType.ts');
const SHARED_CONSTANTS_FILE = path.resolve(__dirname, '../electron/src/shared/contextIsolationConstants.ts');
const PRELOAD_APP_FILE = path.resolve(__dirname, '../electron/src/preload/preload-app.ts');

/**
 * Extract EVENT_TYPE object from the source TypeScript file
 * @param {string} sourceContent - Content of the source file
 * @returns {string} The EVENT_TYPE object as a string
 */
function extractEventType(sourceContent) {
  const regex = /export const EVENT_TYPE = \{/;
  const startMatch = regex.exec(sourceContent);
  if (!startMatch) {
    throw new Error('Could not find EVENT_TYPE export in source file');
  }

  const startIndex = startMatch.index;
  let braceCount = 0;
  let endIndex = startIndex;
  
  for (let i = startIndex; i < sourceContent.length; i++) {
    const char = sourceContent[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  if (braceCount !== 0) {
    throw new Error('Could not find matching closing brace for EVENT_TYPE');
  }
  
  return sourceContent.substring(startIndex, endIndex);
}

/**
 * Generate the shared constants file content
 * @param {string} eventTypeObject - The EVENT_TYPE object string
 * @returns {string} Complete file content
 */
function generateSharedConstantsContent(eventTypeObject) {
  return `/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

/**
 * Shared Context Isolation Constants
 *
 * This file contains constants and utilities that are shared between renderer and preload
 * processes due to context isolation security requirements. With context isolation enabled,
 * these processes cannot directly import modules from the main process, so we need to
 * redefine these constants locally.
 *
 * Security Context: These constants are safe to duplicate because they are just string
 * literals that define event types and logging interfaces. No sensitive functionality
 * is exposed.
 *
 * IMPORTANT: These constants are automatically generated from their main process
 * counterparts using the 'yarn sync:events' command. Do not edit manually.
 * - EVENT_TYPE is automatically generated from electron/src/lib/eventType.ts
 * - WebAppEvents must match @wireapp/webapp-events
 */

/**
 * Event type constants for IPC communication between main and renderer/preload processes.
 * These are automatically generated from electron/src/lib/eventType.ts using 'yarn sync:events'.
 *
 * Context Isolation Security: Due to context isolation, we cannot import the main process
 * eventType module directly in renderer/preload, so we maintain this automatically generated copy.
 */
// NOSONAR - Duplication required for context isolation, automatically generated
${eventTypeObject};

/**
 * WebApp events constants for preload scripts.
 * These must match the constants from @wireapp/webapp-events.
 */
export const WebAppEvents = {
  CONVERSATION: {
    JOIN: 'wire.webapp.conversation.join',
  },
  LIFECYCLE: {
    CHANGE_ENVIRONMENT: 'wire.webapp.lifecycle.change_environment',
    SSO_WINDOW_CLOSED: 'wire.webapp.lifecycle.sso_window_closed',
  },
  PROPERTIES: {
    UPDATE: {
      INTERFACE: {
        THEME: 'wire.webapp.properties.update.interface.theme',
      },
    },
    UPDATED: 'wire.webapp.properties.updated',
  },
} as const;

/**
 * Simple logger implementation for preload scripts.
 *
 * Context Isolation Security: Main process getLogger cannot be imported in preload
 * scripts. This provides a safe logging interface using console methods.
 *
 * @param {string} name - The name/prefix for the logger
 * @returns {Object} Logger object with info, log, warn, and error methods
 */
export const createSandboxLogger = (name: string) => ({
  info: (message: string, ...args: any[]) =>
    // eslint-disable-next-line no-console
    console.info(\`[\${name}] \${message}\`, ...args),
  log: (message: string, ...args: any[]) =>
    // eslint-disable-next-line no-console
    console.log(\`[\${name}] \${message}\`, ...args),
  warn: (message: string, ...args: any[]) =>
    // eslint-disable-next-line no-console
    console.warn(\`[\${name}] \${message}\`, ...args),
  error: (message: string, ...args: any[]) =>
    // eslint-disable-next-line no-console
    console.error(\`[\${name}] \${message}\`, ...args),
});

// Export this to make the file a module and prevent global scope pollution
export {};
`;
}

/**
 * Update preload-app.ts to sync the duplicated EVENT_TYPE constants
 * Note: Preload scripts cannot import from relative paths due to Electron sandbox limitations,
 * so we maintain synchronized duplicates instead.
 * @param {string} filePath - Path to the preload file
 * @param {string} eventTypeObject - The EVENT_TYPE object string
 */
function updatePreloadAppFile(filePath, eventTypeObject) {
  let content = fs.readFileSync(filePath, 'utf8');

  const eventTypeStart = content.indexOf('const EVENT_TYPE = {');
  if (eventTypeStart === -1) {
    console.log('No EVENT_TYPE duplication found in preload-app.ts');
    return;
  }

  let braceCount = 0;
  let eventTypeEnd = eventTypeStart;
  for (let i = eventTypeStart; i < content.length; i++) {
    const char = content[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        let endPos = i;
        while (endPos < content.length && content[endPos] !== '\n') {
          endPos++;
        }
        eventTypeEnd = endPos;
        break;
      }
    }
  }

  const beforeEventType = content.substring(0, eventTypeStart);
  const afterEventType = content.substring(eventTypeEnd + 1);

  const updatedEventType = `/**
 * Event type constants for IPC communication
 *
 * IMPORTANT: This is automatically synchronized from ../shared/contextIsolationConstants.ts
 * using 'yarn sync:events'. Do not edit manually - run the sync command instead.
 *
 * Context Isolation Security: Due to Electron sandbox limitations, preload scripts cannot
 * import from relative paths, so we maintain this synchronized duplicate.
 */
const EVENT_TYPE = ${eventTypeObject.replace('export const EVENT_TYPE = ', '')};`;

  content = beforeEventType + updatedEventType + afterEventType;

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated preload-app.ts with synchronized EVENT_TYPE constants');
}

function syncEvents() {
  try {
    console.log('Synchronizing EVENT_TYPE constants...');
    
    const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');
    
    const eventTypeObject = extractEventType(sourceContent);
    
    const sharedContent = generateSharedConstantsContent(eventTypeObject);
    fs.writeFileSync(SHARED_CONSTANTS_FILE, sharedContent, 'utf8');
    console.log('✓ Updated shared/contextIsolationConstants.ts');
    
    updatePreloadAppFile(PRELOAD_APP_FILE, eventTypeObject);
    console.log('✓ Updated preload/preload-app.ts');
    
    console.log('\nEvent type synchronization completed successfully!');
    console.log('All EVENT_TYPE constants are now in sync with the main process.');
    
  } catch (error) {
    console.error('Error synchronizing events:', error.message);
    process.exit(1);
  }
}

syncEvents();

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
 */

/**
 * MALICIOUS SCRIPT FOR SECURITY TESTING
 *
 * ⚠️  WARNING: This script contains malicious code patterns for testing purposes only!
 *
 * This script attempts various RCE (Remote Code Execution) techniques that should
 * be blocked by context isolation and sandbox enforcement.
 *
 * If any of these attempts succeed, it indicates a security vulnerability.
 */

try {
  const fs = require('fs');
  window.__RCE_SUCCESS_FS = true;
  window.__RCE_FS_METHODS = Object.keys(fs);
} catch (e) {
  window.__RCE_BLOCKED_FS = true;
}

try {
  const proc = process;
  window.__RCE_SUCCESS_PROCESS = true;
  window.__RCE_PROCESS_VERSION = proc.version;
  window.__RCE_PROCESS_ENV = Object.keys(proc.env);
} catch (e) {
  window.__RCE_BLOCKED_PROCESS = true;
}

try {
  const {exec} = require('child_process');
  exec('whoami', (error, stdout, stderr) => { // NOSONAR - Intentional command execution for security testing
    window.__RCE_SUCCESS_EXEC = true;
    window.__RCE_EXEC_OUTPUT = stdout;
  });
} catch (e) {
  window.__RCE_BLOCKED_EXEC = true;
}

try {
  const fs = require('fs');
  const content = fs.readFileSync('/etc/passwd', 'utf8');
  window.__RCE_SUCCESS_FILE_READ = true;
  window.__RCE_FILE_CONTENT = content;
} catch (e) {
  window.__RCE_BLOCKED_FILE_READ = true;
}

try {
  const net = require('net');
  const client = net.createConnection({port: 22}, () => {
    window.__RCE_SUCCESS_NET = true;
  });
  client.on('error', () => {
    window.__RCE_BLOCKED_NET = true;
  });
} catch (e) {
  window.__RCE_BLOCKED_NET = true;
}

try {
  global.__RCE_GLOBAL_POLLUTION = true;
  window.__RCE_SUCCESS_GLOBAL = true;
} catch (e) {
  window.__RCE_BLOCKED_GLOBAL = true;
}

try {
  const buffer = Buffer.from('test');
  window.__RCE_SUCCESS_BUFFER = true;
  window.__RCE_BUFFER_SIZE = buffer.length;
} catch (e) {
  window.__RCE_BLOCKED_BUFFER = true;
}

try {
  const path = require('path');
  window.__RCE_SUCCESS_PATH = true;
  window.__RCE_PATH_SEP = path.sep;
} catch (e) {
  window.__RCE_BLOCKED_PATH = true;
}

try {
  const os = require('os');
  window.__RCE_SUCCESS_OS = true;
  window.__RCE_OS_PLATFORM = os.platform();
  window.__RCE_OS_HOSTNAME = os.hostname();
} catch (e) {
  window.__RCE_BLOCKED_OS = true;
}

try {
  const crypto = require('crypto');
  window.__RCE_SUCCESS_CRYPTO = true;
  window.__RCE_CRYPTO_METHODS = Object.keys(crypto);
} catch (e) {
  window.__RCE_BLOCKED_CRYPTO = true;
}

window.__RCE_TEST_COMPLETE = true;
window.__RCE_RESULTS = {
  fs: window.__RCE_SUCCESS_FS || false,
  process: window.__RCE_SUCCESS_PROCESS || false,
  exec: window.__RCE_SUCCESS_EXEC || false,
  fileRead: window.__RCE_SUCCESS_FILE_READ || false,
  net: window.__RCE_SUCCESS_NET || false,
  global: window.__RCE_SUCCESS_GLOBAL || false,
  buffer: window.__RCE_SUCCESS_BUFFER || false,
  path: window.__RCE_SUCCESS_PATH || false,
  os: window.__RCE_SUCCESS_OS || false,
  crypto: window.__RCE_SUCCESS_CRYPTO || false,
};

console.log('RCE Test Results:', window.__RCE_RESULTS);

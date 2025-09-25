#!/usr/bin/env node

/**
 * Debug script to verify display environment is working correctly
 * This script helps diagnose X server and display issues in CI
 */

console.log('=== Display Environment Debug ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current working directory:', process.cwd());

console.log('\n=== Environment Variables ===');
console.log('DISPLAY:', process.env.DISPLAY);
console.log('CI:', process.env.CI);
console.log('GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ELECTRON_DISABLE_SECURITY_WARNINGS:', process.env.ELECTRON_DISABLE_SECURITY_WARNINGS);
console.log('ELECTRON_DISABLE_GPU:', process.env.ELECTRON_DISABLE_GPU);
console.log('ELECTRON_NO_ATTACH_CONSOLE:', process.env.ELECTRON_NO_ATTACH_CONSOLE);
console.log('WIRE_FORCE_EXTERNAL_AUTH:', process.env.WIRE_FORCE_EXTERNAL_AUTH);

console.log('\n=== X Server Check ===');
const { execSync } = require('child_process');

try {
  const xvfbProcesses = execSync('ps aux | grep -i xvfb | grep -v grep', { encoding: 'utf8' });
  console.log('Xvfb processes:');
  console.log(xvfbProcesses);
} catch (error) {
  console.log('No Xvfb processes found or error checking:', error.message);
}

try {
  const displayCheck = execSync('echo $DISPLAY', { encoding: 'utf8' });
  console.log('Shell DISPLAY variable:', displayCheck.trim());
} catch (error) {
  console.log('Error checking shell DISPLAY:', error.message);
}

if (process.env.DISPLAY) {
  try {
    // Try to test the display
    const xdpyinfo = execSync(`DISPLAY=${process.env.DISPLAY} xdpyinfo | head -10`, { encoding: 'utf8' });
    console.log('Display info (first 10 lines):');
    console.log(xdpyinfo);
  } catch (error) {
    console.log('Error getting display info:', error.message);
  }
}

console.log('\n=== Electron Path Check ===');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(process.cwd(), '../..');
const electronDir = path.join(projectRoot, 'node_modules/electron/dist');

let electronPath;
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
    electronPath = 'unknown';
}

console.log('Expected Electron path:', electronPath);
console.log('Electron exists:', fs.existsSync(electronPath));

if (fs.existsSync(electronDir)) {
  console.log('Electron directory contents:');
  try {
    const contents = fs.readdirSync(electronDir);
    console.log(contents.slice(0, 10)); // Show first 10 items
  } catch (error) {
    console.log('Error reading electron directory:', error.message);
  }
}

console.log('\n=== Debug Complete ===');

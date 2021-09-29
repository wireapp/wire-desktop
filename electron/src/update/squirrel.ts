/*
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

// https://github.com/atom/atom/blob/ce18e1b7d65808c42df5b612d124935ab5c06490/src/main-process/squirrel-update.js

import {app, shell} from 'electron';
import {StringUtil} from '@wireapp/commons';
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import * as lifecycle from '../runtime/lifecycle';
import {config, MINUTE_IN_MILLIS, HOUR_IN_MILLIS} from '../settings/config';

const logger = getLogger(path.basename(__filename));

const appFolder = path.resolve(process.execPath, '..');
const rootFolder = path.resolve(appFolder, '..');
const updateDotExe = path.join(rootFolder, 'Update.exe');

const linkName = `${config.name}.lnk`;
const windowsAppData = process.env.APPDATA;
// @see https://www.zdnet.com/article/windows-10-tip-add-custom-shortcuts-to-the-start-menu/
const startShortcut = path.join(app.getPath('appData'), `Microsoft/Windows/Start Menu/Programs/${config.name}.lnk`);
// @see https://www.howtogeek.com/436615/how-to-create-desktop-shortcuts-on-windows-10-the-easy-way/
const desktopShortcut = path.join(app.getPath('desktop'), `${config.name}.lnk`);
// @see https://www.lifewire.com/add-quick-launch-toolbar-in-windows-10-5115231
const quickLaunchShortcut = windowsAppData
  ? path.resolve(windowsAppData, 'Microsoft/Internet Explorer/Quick Launch/User Pinned/TaskBar', linkName)
  : '';

if (!windowsAppData && EnvironmentUtil.platform.IS_WINDOWS) {
  logger.error('No Windows AppData directory found.');
}

enum SQUIRREL_ARGUMENT {
  INSTALL = '--squirrel-install',
  OBSOLETE = '--squirrel-obsolete',
  UNINSTALL = '--squirrel-uninstall',
  UPDATE = '--update',
  UPDATED = '--squirrel-updated',
}

function spawn(command: string, args: string[]): Promise<void> {
  const commandFile = path.basename(command);

  return new Promise(resolve => {
    const spawnedProcess = childProcess
      .spawn(command, args)
      .on('error', error => logger.error(error))
      .on('close', (code, signal) => {
        if (code !== 0) {
          const exitReason = signal || `exit code ${code}`;
          logger.error(`Running command "${command}" failed: received ${exitReason}`);
        }
        resolve();
      });

    if (spawnedProcess.stdout) {
      spawnedProcess.stdout.on('data', (data: Buffer) => {
        const stringifiedData = data.toString().trim();
        if (stringifiedData) {
          logger.info(`${commandFile}: ${stringifiedData}`);
        }
      });
    }
    if (spawnedProcess.stderr) {
      spawnedProcess.stderr.on('data', (data: Buffer) => {
        const stringifiedData = data.toString().trim();
        if (stringifiedData) {
          logger.error(`${commandFile}: ${stringifiedData}`);
        }
      });
    }
  });
}

async function spawnUpdate(args: string[]): Promise<void> {
  logger.info('Running updater ...');
  const updateDotExeExists = fs.existsSync(updateDotExe);
  if (!updateDotExeExists) {
    logger.info(`Could not find updater in "${updateDotExe}".`);
  }

  try {
    await spawn(updateDotExe, args);
  } catch (error) {
    logger.error(error);
  }
}

function createShortcut(location: string): boolean {
  // As documented in https://github.com/electron/windows-installer/issues/296,
  // Squirrel has problems with notification clicks on Windows 10.
  // The easiest workaround is to create shortcuts on our own.
  return shell.writeShortcutLink(location, 'create', {
    appUserModelId: config.appUserModelId,
    target: process.execPath,
  });
}

function createShortcuts(): void {
  logger.info('Creating shortcut in the start menu ...');
  const startResult = createShortcut(startShortcut);

  logger.info('Creating shortcut on the desktop ...');
  const desktopResult = createShortcut(desktopShortcut);

  let quickLaunchResult = false;
  if (quickLaunchShortcut) {
    logger.info('Creating shortcut in the quick launch menu ...');
    quickLaunchResult = createShortcut(desktopShortcut);
  }

  logger.info('Created shortcuts:', {desktop: desktopResult, quickLaunch: quickLaunchResult, start: startResult});
}

async function removeShortcuts(): Promise<void> {
  logger.info('Removing all shortcuts ...');

  logger.info(`Removing start menu shortcut "${startShortcut}" ...`);
  await fs.remove(startShortcut);

  logger.info(`Removing desktop shortcut "${desktopShortcut}" ...`);
  await fs.remove(desktopShortcut);

  if (quickLaunchShortcut) {
    logger.info(`Removing quick launch menu shortcut "${quickLaunchShortcut}" ...`);
    await fs.remove(quickLaunchShortcut);
  }
}

export async function installUpdate(): Promise<void> {
  logger.info(`Checking for Windows updates at "${EnvironmentUtil.app.UPDATE_URL_WIN}" ...`);
  await spawnUpdate([SQUIRREL_ARGUMENT.UPDATE, EnvironmentUtil.app.UPDATE_URL_WIN]);
}

async function scheduleUpdate(): Promise<void> {
  const squirrelDelay = config.squirrelUpdateInterval.DELAY;
  const squirrelInterval = config.squirrelUpdateInterval.INTERVAL;
  const nextCheck = squirrelDelay / MINUTE_IN_MILLIS;
  const regularCheck = squirrelInterval / HOUR_IN_MILLIS;
  const readableNextCheck = `${nextCheck} ${StringUtil.pluralize('minute', nextCheck)}`;
  const readableRegularCheck = `${regularCheck} ${StringUtil.pluralize('hour', regularCheck)}`;
  logger.info(`Scheduling Windows update to check in "${readableNextCheck}" and every "${readableRegularCheck}" ...`);

  setTimeout(installUpdate, squirrelDelay);
  setInterval(installUpdate, squirrelInterval);
}

// Squirrel spawns our app with a special command-line flag to indicate the installation lifecycle.
// @see https://github.com/electron/windows-installer/tree/v4.0.1#handling-squirrel-events
export async function handleSquirrelArgs(): Promise<void> {
  const squirrelArgument = process.argv[1];

  logger.info(`Command-line flag provided by Squirrel: ${process.argv[0]} ${squirrelArgument}`);

  switch (squirrelArgument) {
    case SQUIRREL_ARGUMENT.INSTALL: {
      createShortcuts();
      await lifecycle.quit();
      return;
    }

    case SQUIRREL_ARGUMENT.UPDATED: {
      await lifecycle.quit();
      return;
    }

    case SQUIRREL_ARGUMENT.UNINSTALL: {
      await removeShortcuts();
      await lifecycle.quit();
      return;
    }

    case SQUIRREL_ARGUMENT.OBSOLETE: {
      await lifecycle.quit();
      return;
    }
  }

  await scheduleUpdate();
}

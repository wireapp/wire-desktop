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

import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as moment from 'moment';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import * as lifecycle from '../runtime/lifecycle';
import {config} from '../settings/config';

const logger = getLogger(path.basename(__filename));

const appFolder = path.resolve(process.execPath, '..');
const rootFolder = path.resolve(appFolder, '..');
const updateDotExe = path.join(rootFolder, 'Update.exe');

const exeName = `${config.name}.exe`;
const linkName = `${config.name}.lnk`;
const windowsAppData = process.env.APPDATA;

if (!windowsAppData && EnvironmentUtil.platform.IS_WINDOWS) {
  logger.error('No Windows AppData directory found.');
}

const shortcutLink = windowsAppData
  ? path.resolve(windowsAppData, 'Microsoft/Internet Explorer/Quick Launch/User Pinned/TaskBar', linkName)
  : '';

enum SQUIRREL_EVENT {
  CREATE_SHORTCUT = '--createShortcut',
  INSTALL = '--squirrel-install',
  OBSOLETE = '--squirrel-obsolete',
  REMOVE_SHORTCUT = '--removeShortcut',
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
  logger.info(`Running updater ...`);
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

async function createStartShortcut(): Promise<void> {
  logger.info(`Creating shortcut in the start menu ...`);
  await spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=StartMenu']);
}

async function createDesktopShortcut(): Promise<void> {
  logger.info(`Creating shortcut on the desktop ...`);
  await spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=Desktop']);
}

async function removeShortcuts(): Promise<void> {
  logger.info(`Removing all shortcuts ...`);
  await spawnUpdate([SQUIRREL_EVENT.REMOVE_SHORTCUT, exeName, '-l=Desktop,Startup,StartMenu']);
  if (shortcutLink) {
    await fs.remove(shortcutLink);
  }
}

export async function installUpdate(): Promise<void> {
  logger.info(`Checking for Windows updates at "${EnvironmentUtil.app.UPDATE_URL_WIN}" ...`);
  await spawnUpdate([SQUIRREL_EVENT.UPDATE, EnvironmentUtil.app.UPDATE_URL_WIN]);
}

async function scheduleUpdate(): Promise<void> {
  const pluralize = (num: number, str: string) => `${num} ${str}${num === 1 ? '' : 's'}`;
  const nextCheck = moment.duration(config.squirrelUpdateInterval.DELAY).asMinutes();
  const everyCheck = moment.duration(config.squirrelUpdateInterval.INTERVAL).asHours();
  logger.info(
    `Scheduling Windows update to check in "${pluralize(nextCheck, 'minute')}" and every "${pluralize(
      everyCheck,
      'hour',
    )}" ...`,
  );

  setTimeout(installUpdate, config.squirrelUpdateInterval.DELAY);
  setInterval(installUpdate, config.squirrelUpdateInterval.INTERVAL);
}

export async function handleSquirrelEvent(isFirstInstance?: boolean): Promise<boolean | void> {
  const [, squirrelEvent] = process.argv;

  switch (squirrelEvent) {
    case SQUIRREL_EVENT.INSTALL: {
      await createStartShortcut();
      await createDesktopShortcut();
      lifecycle.quit();
      return true;
    }

    case SQUIRREL_EVENT.UPDATED: {
      lifecycle.quit();
      return true;
    }

    case SQUIRREL_EVENT.UNINSTALL: {
      await removeShortcuts();
      lifecycle.quit();
      return true;
    }

    case SQUIRREL_EVENT.OBSOLETE: {
      lifecycle.quit();
      return true;
    }
  }

  if (!isFirstInstance) {
    return lifecycle.quit();
  }

  await scheduleUpdate();
}

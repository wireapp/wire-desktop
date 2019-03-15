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

import {spawn} from 'child_process';
import {app} from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';

import {getLogger} from '../js/getLogger';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import * as lifecycle from '../runtime/lifecycle';
import * as config from '../settings/config';

app.setAppUserModelId(`com.squirrel.wire.${config.NAME.toLowerCase()}`);

const logger = getLogger('squirrel');

const rootFolder = path.resolve(process.execPath, '../../');
const updateDotExe = path.join(rootFolder, 'Squirrel.exe');

const exeName = `${config.NAME}.exe`;
const linkName = `${config.NAME}.lnk`;
const windowsAppData = process.env.APPDATA || '';

if (!windowsAppData && EnvironmentUtil.platform.IS_WINDOWS) {
  logger.error('No Windows AppData directory found.');
}

const taskbarLink = path.resolve(windowsAppData, 'Microsoft/Internet Explorer/Quick Launch/User Pinned/TaskBar');

const shortcutLink = path.resolve(taskbarLink, linkName);

enum SQUIRREL_EVENT {
  CREATE_SHORTCUT = '--createShortcut',
  INSTALL = '--squirrel-install',
  OBSOLETE = '--squirrel-obsolete',
  REMOVE_SHORTCUT = '--removeShortcut',
  UNINSTALL = '--squirrel-uninstall',
  UPDATE = '--update',
  UPDATED = '--squirrel-updated',
}

async function spawnAsync(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let stdout = '';

    const spawnedProcess = spawn(command, args);

    if (spawnedProcess.stdout) {
      spawnedProcess.stdout.on('data', data => (stdout += data));
    }

    spawnedProcess.on('close', (code, signal) => {
      if (code !== 0) {
        logger.info({code, stdout, signal});
        return reject(`Command "${command}" failed with error code "${code}".`);
      }

      resolve();
    });
    spawnedProcess.on('error', reject);
    spawnedProcess.on('message', logger.log);
  });
}

const spawnUpdate = (args: string[]) => spawnAsync(updateDotExe, args);
const createStartShortcut = () => spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=StartMenu']);
const createDesktopShortcut = () => spawnUpdate([SQUIRREL_EVENT.CREATE_SHORTCUT, exeName, '-l=Desktop']);
const installUpdate = () => spawnUpdate([SQUIRREL_EVENT.UPDATE, EnvironmentUtil.app.UPDATE_URL_WIN]);

const removeShortcuts = async (): Promise<void> => {
  await spawnUpdate([SQUIRREL_EVENT.REMOVE_SHORTCUT, exeName, '-l=Desktop,Startup,StartMenu']);
  await fs.remove(shortcutLink);
};

const scheduleUpdate = (): void => {
  setTimeout(installUpdate, config.UPDATE.DELAY);
  setInterval(installUpdate, config.UPDATE.INTERVAL);
};

const handleSquirrelEvent = async (isFirstInstance: boolean): Promise<void> => {
  const squirrelEvent = process.argv[1];

  if (!isFirstInstance) {
    return lifecycle.quit();
  }

  switch (squirrelEvent) {
    case SQUIRREL_EVENT.INSTALL: {
      await createStartShortcut();
      await createDesktopShortcut();
      return lifecycle.quit();
    }

    case SQUIRREL_EVENT.UNINSTALL: {
      await removeShortcuts();
      lifecycle.quit();
    }

    case SQUIRREL_EVENT.UPDATED:
    case SQUIRREL_EVENT.OBSOLETE: {
      lifecycle.quit();
    }
  }

  scheduleUpdate();
};

export const Squirrel = {handleSquirrelEvent, installUpdate};

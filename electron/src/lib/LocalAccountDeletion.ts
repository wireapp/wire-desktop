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

import {IpcMessageEvent, app, webContents} from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as util from '../js/util';
import {LogFactory} from '../util';

const USER_DATA_DIR = app.getPath('userData');
const LOG_DIR = path.join(USER_DATA_DIR, 'logs');

LogFactory.LOG_FILE_PATH = LOG_DIR;
LogFactory.LOG_FILE_NAME = 'electron.log';
const logger = LogFactory.getLogger('localAccountDeletion.ts');

const clearStorage = (session: Electron.Session) => {
  return new Promise(resolve =>
    session.clearStorageData({}, () =>
      session.clearCache(() => {
        session.flushStorageData();
        resolve();
      })
    )
  );
};

export async function deleteAccount(event: IpcMessageEvent, id: number, accountId: string, partitionId?: string) {
  // Delete session data
  try {
    const webviewWebcontent = webContents.fromId(id);
    if (!webviewWebcontent) {
      throw new Error(`Unable to find webview content id "${id}"`);
    }
    if (!webviewWebcontent.hostWebContents) {
      throw new Error('Only a webview can have its storage wiped');
    }
    logger.log(`Deleting session data for account "${accountId}"...`);
    await clearStorage(webviewWebcontent.session);
    logger.log(`Deleted session data for account "${accountId}".`);
  } catch (error) {
    logger.log(`Failed to delete session data for account "${accountId}", reason: "${error.message}".`);
  }

  // Delete the webview partition
  // Note: The first account always uses the default session,
  // therefore partitionId is optional
  // ToDo: Move the first account to a partition
  if (partitionId) {
    try {
      if (!util.isUUID(partitionId)) {
        throw new Error('Partition is not an UUID');
      }
      const partitionDir = path.join(USER_DATA_DIR, 'Partitions', partitionId);
      await fs.remove(partitionDir);
      logger.log(`Deleted partition "${partitionId}" for account "${accountId}".`);
    } catch (error) {
      logger.log(`Unable to delete partition "${partitionId}" for account "${accountId}", reason: "${error.message}".`);
    }
  }

  // Delete logs for this account
  try {
    if (!util.isUUID(accountId)) {
      throw new Error('Account is not an UUID');
    }
    const sessionFolder = path.join(LOG_DIR, accountId);
    await fs.remove(sessionFolder);
    logger.log(`Deleted logs folder for account "${accountId}".`);
  } catch (error) {
    logger.log(`Failed to delete logs folder for account "${accountId}", reason: "${error.message}".`);
  }
}

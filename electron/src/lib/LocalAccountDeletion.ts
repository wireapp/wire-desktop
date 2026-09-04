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

import {app, Session, webContents} from 'electron';
import * as fs from 'fs-extra';
import {truncate} from 'lodash';

import * as path from 'path';

import {ValidationUtil} from '@wireapp/commons';

import {deleteAccountLogDirectories} from './accountLogDeletion';

import {getLogger} from '../logging/getLogger';
import {
  LogDirectoryCleanupDependencies,
  LogDirectoryCleanupResult,
  removeEmptyLogDirectoryAncestors,
} from '../logging/logDirectoryCleanup';
import {getLogFilenames} from '../logging/logFiles';
import {getLogDirectory} from '../logging/logPaths';

const logger = getLogger(path.basename(__filename));

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getUserDataDirectory(): string {
  return app.getPath('userData');
}

const clearStorage = async (session: Session): Promise<void> => {
  await session.clearStorageData();
  await session.clearCache();
  session.flushStorageData();
};

export async function deleteAccount(id: number, accountId: string, partitionId?: string): Promise<void> {
  const truncatedId = truncate(accountId, {length: 5});

  // Delete session data
  try {
    const webviewWebContent = webContents.fromId(id);
    if (!webviewWebContent) {
      throw new Error(`Unable to find webview content id "${id}"`);
    }
    if (!webviewWebContent.hostWebContents) {
      throw new Error('Only a webview can have its storage wiped');
    }
    logger.log(`Deleting session data for account "${truncatedId}"...`);
    await clearStorage(webviewWebContent.session);
    logger.log(`Deleted session data for account "${truncatedId}".`);
  } catch (error) {
    logger.error(`Failed to delete session data for account "${truncatedId}", reason: "${getErrorMessage(error)}".`);
  }

  // Delete the webview partition
  // Note: The first account always uses the default session,
  // therefore partitionId is optional
  // ToDo: Move the first account to a partition
  if (partitionId) {
    try {
      if (!ValidationUtil.isUUIDv4(partitionId)) {
        throw new Error('Partition is not an UUID');
      }
      const partitionDir = path.join(getUserDataDirectory(), 'Partitions', partitionId);
      await fs.remove(partitionDir);
      logger.log(`Deleted partition "${partitionId}" for account "${truncatedId}".`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      logger.log(
        `Unable to delete partition "${partitionId}" for account "${truncatedId}", reason: "${errorMessage}".`,
      );
    }
  }

  // Delete logs for this account
  try {
    if (!ValidationUtil.isUUIDv4(accountId)) {
      throw new Error('Account is not an UUID');
    }
    const logDirectory = getLogDirectory();
    const logFilePaths = getLogFilenames({absolute: true, baseDirectory: logDirectory});
    const directoryCleanupDependencies: LogDirectoryCleanupDependencies = {
      async getDirectoryMetadata(directoryPath: string) {
        const directoryStatistics = await fs.lstat(directoryPath);

        return {
          isDirectory: directoryStatistics.isDirectory(),
          isSymbolicLink: directoryStatistics.isSymbolicLink(),
        };
      },
      async removeDirectory(directoryPath: string): Promise<void> {
        await fs.rmdir(directoryPath);
      },
    };

    await deleteAccountLogDirectories({
      accountId,
      dependencies: {
        async isSafeDirectory(directoryPath: string): Promise<boolean> {
          try {
            const directoryMetadata = await directoryCleanupDependencies.getDirectoryMetadata(directoryPath);

            return directoryMetadata.isDirectory && directoryMetadata.isSymbolicLink === false;
          } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
              return false;
            }

            throw error;
          }
        },
        async removeEmptyDirectoryAncestors(directoryPath: string): Promise<LogDirectoryCleanupResult> {
          return removeEmptyLogDirectoryAncestors({
            dependencies: directoryCleanupDependencies,
            logDirectory,
            pathToRemove: directoryPath,
            pathType: 'directory',
          });
        },
        async removeDirectory(directoryPath: string): Promise<void> {
          await fs.remove(directoryPath);
        },
        reportFailure: (message: string, error: unknown): void => {
          logger.error(`${message}: ${getErrorMessage(error)}`);
        },
      },
      filePaths: logFilePaths,
      logDirectory,
    });

    logger.log(`Deleted logs folder for account "${truncatedId}".`);
  } catch (error) {
    logger.error(`Failed to delete logs folder for account "${truncatedId}", reason: "${getErrorMessage(error)}".`);
  }
}

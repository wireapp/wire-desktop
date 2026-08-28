/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import * as path from 'path';

import {runDesktopLogCleanupWithinMaintenance, runDesktopLogMaintenance} from './desktopLogWriter';
import {getLogger} from './getLogger';
import {
  createLogArchiveDependencies,
  createLogSnapshot,
  createLogSnapshotFileSystemDependencies,
  exportLogFiles,
  streamLogFilesToZip,
} from './logExport';
import {getLogFilenames as getLogFilenamesFromRoot, LogFileDiscoveryOptions} from './logFiles';
import {getLogDirectory} from './logPaths';

const logger = getLogger(path.basename(__filename));

export function getLogFilenames(parameters: LogFileDiscoveryOptions): string[] {
  return getLogFilenamesFromRoot(parameters);
}

export async function exportLogs(destinationPath: string): Promise<void> {
  const logDirectory = getLogDirectory();
  const snapshotFileSystemDependencies = createLogSnapshotFileSystemDependencies();
  const archiveDependencies = createLogArchiveDependencies((message: string, error: unknown): void => {
    logger.error(message, error);
  });

  try {
    await exportLogFiles({
      createSnapshot() {
        return createLogSnapshot({
          cleanup: runDesktopLogCleanupWithinMaintenance,
          discoverLogFilePaths() {
            return getLogFilenames({absolute: false, baseDirectory: logDirectory});
          },
          logDirectory,
          reportFailure(message: string, error: unknown) {
            logger.error(message, error);
          },
          runMaintenance: runDesktopLogMaintenance,
          dependencies: snapshotFileSystemDependencies,
        });
      },
      destinationPath,
      removeSnapshotDirectory: snapshotFileSystemDependencies.removeDirectory,
      reportFailure(message: string, error: unknown) {
        logger.error(message, error);
      },
      streamSnapshot({destinationPath: snapshotDestinationPath, snapshotFiles}) {
        return streamLogFilesToZip({
          destinationPath: snapshotDestinationPath,
          snapshotFiles,
          dependencies: archiveDependencies,
        });
      },
    });
  } catch (error) {
    logger.error('Failed to export desktop logs.', error);
  }
}

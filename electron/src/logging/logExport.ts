/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

export type GatherLogFilesParameters = {
  cleanup: () => Promise<void>;
  discoverLogFilePaths: () => readonly string[];
  logDirectory: string;
  readFile: (filePath: string) => Promise<Uint8Array>;
  reportReadFailure: (filePath: string, error: unknown) => void;
  runMaintenance<Result>(operation: () => Promise<Result>): Promise<Result>;
};

export async function gatherLogFiles(parameters: GatherLogFilesParameters): Promise<Record<string, Uint8Array>> {
  return parameters.runMaintenance(async () => {
    await parameters.cleanup();

    const logFiles: Record<string, Uint8Array> = {};
    const relativeFilePaths = parameters.discoverLogFilePaths();

    for (const relativeFilePath of relativeFilePaths) {
      const resolvedPath = path.join(parameters.logDirectory, relativeFilePath);

      try {
        logFiles[relativeFilePath] = await parameters.readFile(resolvedPath);
      } catch (error) {
        parameters.reportReadFailure(relativeFilePath, error);
      }
    }

    return logFiles;
  });
}

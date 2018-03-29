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

const fs = require('fs-extra');
const logdown = require('logdown');
const moment = require('moment');
const path = require('path');
const tar = require('tar');

const {PriorityQueue} = require('@wireapp/priority-queue');

class BackupWriter {
  constructor(rootDirectory) {
    this.logger = logdown('wire-desktop/backup/BackupWriter', {
      logger: console,
      markdown: false,
    });
    this.rootDirectory = rootDirectory;
    this.writeQueue = new PriorityQueue({maxRetries: 1});
  }

  cancel() {
    this.writeQueue.deleteAll();
  }

  async saveTable(tableName, dataOrLength, tempDirectory) {
    return this.writeQueue.add(() => {
      const tempFile = path.join(tempDirectory, `${tableName}.txt`);

      if (typeof dataOrLength === 'number') {
        this.logger.info(`Saving "${dataOrLength}" records from "${tableName}"...`);
        // TODO: save number of entries
      } else {
        return fs.outputFile(tempFile, `${dataOrLength}\r\n`, {flag: 'a'});
      }
    });
  }

  saveMetaDescription(metaData, tempDirectory) {
    const file = path.join(tempDirectory, 'export.json');
    return fs.outputFile(file, metaData);
  }

  async saveArchiveFile(tempDirectory) {
    const timestamp = moment().format('YYYY-MM-DD');
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.writeQueue.isPending === false) {
          clearInterval(interval);
          resolve();
        }
      }, 500);
    });

    const backupFiles = await fs.readdir(tempDirectory);
    const archiveFile = path.resolve(this.rootDirectory, `backup-${timestamp}.tar.gz`);

    if (!backupFiles.length) {
      throw new Error(`No files to archive from "${tempDirectory}": Directory empty.`);
    }

    await tar.c({
      cwd: tempDirectory,
      file: archiveFile,
      gzip: true,
      preservePaths: false,
    }, backupFiles);

    return archiveFile;
  }
}

module.exports = BackupWriter;

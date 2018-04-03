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
  constructor(rootDirectory, finalRecordCount, exportFilename) {
    this.logger = logdown('wire-desktop/backup/BackupWriter', {
      logger: console,
      markdown: false,
    });

    this.exportedRecords = 0;
    this.exportedRows = [];
    this.exportFilename = exportFilename;
    this.finalRecordCount = finalRecordCount;
    this.tempDirectory = path.join(rootDirectory, '.temp');
    this.writeQueue = new PriorityQueue({maxRetries: 1});
    this.logger.info(`Storing "${finalRecordCount}" records...`);
  }

  init() {
    return this.removeTemp();
  }

  removeTemp() {
    return fs.remove(this.tempDirectory);
  }

  cancel() {
    this.writeQueue.deleteAll();
    return this.removeTemp();
  }

  saveBatch(tableName, row) {
    const tempFile = path.join(this.tempDirectory, `${tableName}.txt`);

    return this.writeQueue.add(() => {
      const stringified = JSON.stringify(row);
      if (this.exportedRows.includes(row.id)) {
        return;
      }
      this.exportedRows.push(row.id);
      this.exportedRecords++;
      return fs.outputFile(tempFile, `${stringified}\r\n`, {flag: 'a'});
    });
  }

  saveMetaDescription(metaData) {
    return this.writeQueue.add(() => {
      const file = path.join(this.tempDirectory, 'export.json');
      this.logger.info('Writing meta data file...');
      return fs.outputFile(file, JSON.stringify(metaData, null, 2));
    });
  }

  async saveArchiveFile() {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.writeQueue.isPending === false) {
          clearInterval(interval);
          resolve();
        }
      }, 500);
    });

    if (this.exportedRecords !== this.finalRecordCount) {
      throw new Error(`finalRecordCount is "${this.finalRecordCount}", but "${this.exportedRecords}" records were exported.`);
    }

    const backupFiles = await fs.readdir(this.tempDirectory);

    if (!backupFiles.length) {
      throw new Error(`No files to archive from "${this.tempDirectory}": Directory empty.`);
    }

    await tar.c({
      cwd: this.tempDirectory,
      file: this.exportFilename,
      gzip: true,
      preservePaths: false,
    }, backupFiles);
  }
}

module.exports = BackupWriter;

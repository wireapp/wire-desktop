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
const uuid = require('uuid/v4');
const {PriorityQueue} = require('@wireapp/priority-queue');

class BackupWriter {
  constructor(rootDirectory, tempDirectory) {
    this.logger = logdown('wire-desktop/backup/BackupWriter');
    this.rootDirectory = rootDirectory;
    this.writeQueue = new PriorityQueue({maxRetries: 1});
  }

  cancel() {
    this.writeQueue.deleteAll();
  }

  async removeTemp() {
    await fs.remove(this.tempDirectory);
  }

  async saveTable(tableName, dataOrLength) {
    this.tempDirectory = path.resolve(this.rootDirectory, `.temp-${uuid()}`);
    await fs.ensureDir(this.tempDirectory);

    return this.writeQueue.add(() => {
      const tempFile = path.join(this.tempDirectory, `${tableName}.txt`);

      if (typeof dataOrLength === 'number') {
        this.logger.info(`Saving "${dataOrLength}" records from "${tableName}"...`);
        // TODO: save number of entries
      } else {
        return fs.outputFile(tempFile, `${dataOrLength}\r\n`, {flag: 'a'});
      }
    });
  }

  saveMetaDescription(metaData) {
    const file = path.join(this.tempDirectory, 'export.json');
    return fs.outputFile(file, metaData);
  }

  async saveArchiveFile() {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.writeQueue.isPending === false) {
          clearInterval(interval);
          resolve();
        }
      }, 500);
    });

    const backupFiles = await fs.readdir(this.tempDirectory);
    const archiveFile = path.resolve(this.rootDirectory, `backup-${timestamp}.tar.gz`);

    if (!backupFiles.length) {
      throw new Error(`No files to archive from "${this.tempDirectory}": Directory empty.`);
    }

    await tar.c({
      cwd: this.tempDirectory,
      file: archiveFile,
      gzip: true,
      preservePaths: false,
    }, backupFiles);

    await this.removeTemp();

    return archiveFile;
  }
}

module.exports = BackupWriter;

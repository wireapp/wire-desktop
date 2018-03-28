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
const moment = require('moment');
const path = require('path');
const tar = require('tar');

class BackupWriter {
  constructor(rootDirectory, tempDirectory) {
    this.rootDirectory = rootDirectory;
    this.tempDirectory = tempDirectory;
  }

  saveTable(tableName, dataOrLength) {
    const tempFile = path.join(this.tempDirectory, `${tableName}.txt`);
    console.log(`Writing to file "${tempFile}" ...`);

    if (typeof dataOrLength === 'number') {
      //return fs.remove(tempFile);
    } else {
      return fs.outputFile(tempFile, `${dataOrLength}\r\n`, {flag: 'a'});
    }
  }

  saveMetaDescription(metaData) {
    const file = path.join(this.tempDirectory, 'export.json');
    return fs.outputFile(file, metaData);
  }

  async saveArchiveFile() {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupFiles = await fs.readdir(this.tempDirectory);
    const archiveFile = path.resolve(this.rootDirectory, `backup-${timestamp}.tar.gz`);

    if (!backupFiles.length) {
      throw new Error(`No files to archive from "${this.tempDirectory}": Directory empty.`)
    }

    await tar.c({
      cwd: this.tempDirectory,
      gzip: true,
      preservePaths: false,
      file: archiveFile
    }, backupFiles);

    await fs.remove(this.tempDirectory);

    return archiveFile;
  }
}

module.exports = BackupWriter;

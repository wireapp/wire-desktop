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
const path = require('path');
const tar = require('tar');

class BackupReader {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
    this.tempDirectory = path.join(this.rootDirectory, '.temp');
  };

  removeTemp() {
    return fs.remove(this.tempDirectory);
  }

  async restoreFromArchive(filename) {
    const resolvedFilename = path.resolve(filename);
    const archiveName = path.basename(resolvedFilename).replace(/\..+$/, '');
    const restoreDirectory = path.join(this.tempDirectory, archiveName);

    await fs.ensureDir(restoreDirectory);

    await tar.x({
      cwd: restoreDirectory,
      file: resolvedFilename,
    });

    const metaData = await fs.readFile(path.join(restoreDirectory, 'export.json'), 'utf8');

    const tableFiles = (await fs.readdir(restoreDirectory)).filter(name => name !== 'export.json');

    const tables = await Promise.all(tableFiles.map(async name => {
      const resolvedName = path.join(restoreDirectory, name);
      const content = await fs.readFile(resolvedName, 'utf8');
      const sanitizedName = name.replace(/\..+$/, '');
      return {content, name: sanitizedName};
    }));

    return [metaData, tables];
  }
}

module.exports = BackupReader;

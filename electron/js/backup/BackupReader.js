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
  constructor(rootDirectory, tempDirectory) {
    this.rootDirectory = rootDirectory;
    this.tempDirectory = tempDirectory;
  };

  async restoreFromArchive(filename) {
    const resolvedFilename = path.resolve(filename);
    const restoreDirectory = path.resolve(this.rootDirectory, path.basename(resolvedFilename).replace(/\..+$/, ''))

    await fs.ensureDir(restoreDirectory);

    await tar.x({
      cwd: restoreDirectory,
      file: resolvedFilename,
    });

    const metaData = await fs.readFile(path.resolve(restoreDirectory, 'export.json', 'utf8'));

    const tableFiles = await fs.readdir().filter(filename => !filename !== 'export.json');

    const tables = await Promise.all(tableFiles.map(filename => {
      const file = path.resolve(restoreDirectory, filename);
      return fs.readFile(file, 'utf8');
    }));

    await fs.remove(restoreDirectory);

    return [metaData, tables];
  }
}

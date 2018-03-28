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

const BackupReader = require('./BackupReader');
const BackupWriter = require('./BackupWriter');
const path = require('path');

class BackupManager {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
    this.tempDirectory = path.resolve(this.rootDirectory, '.temp');

    this.backupReader = new BackupReader(this.rootDirectory, this.tempDirectory);
    this.backupWriter = new BackupWriter(this.rootDirectory, this.tempDirectory);
  }
}

module.exports = BackupManager;

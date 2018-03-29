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
const uuid = require('uuid/v4');

const BackupReader = require('./BackupReader');
const BackupWriter = require('./BackupWriter');

class BackupManager {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
    this.tempDirectory = null;

    this.reader = new BackupReader(this.rootDirectory);
    this.writer = new BackupWriter(this.rootDirectory);
  }

  async createTemp() {
    this.tempDirectory = path.resolve(this.rootDirectory, `.temp-${uuid()}`);
    await fs.ensureDir(this.tempDirectory);
  }

  async deleteTemp() {
    await fs.remove(this.tempDirectory);
    this.tempDirectory = null;
  }
}

module.exports = BackupManager;

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
const Joi = require('joi');
const path = require('path');
const tar = require('tar');

const {DifferentAccountError, IncompatibleBackupError, InvalidMetaDataError} = require('./BackupImportError');

class BackupReader {
  constructor(rootDirectory) {
    this.logger = logdown('wire-desktop/backup/BackupReader', {
      logger: console,
      markdown: false,
    });
    this.metaDescriptorSchema = Joi.object().keys({
      client_id: Joi.string().required(),
      creation_time: Joi.string().required(),
      platform: Joi.string().required().equal('Desktop'),
      user_id: Joi.string().required(),
      version: Joi.number().integer().min(15),
    });
    this.rootDirectory = rootDirectory;
    this.tempDirectory = path.join(this.rootDirectory, '.temp');
  };

  removeTemp() {
    return fs.remove(this.tempDirectory);
  }

  async readMetaData(restoreDirectory) {
    try {
      const metaText = await fs.readFile(path.join(restoreDirectory, 'export.json'), 'utf8');
      const metaJSON = JSON.parse(metaText);
      await Joi.validate(metaJSON, this.metaDescriptorSchema);
      return metaJSON;
    } catch (error) {
      const message = `Parsing meta data failed: ${error.message}`;
      this.logger.error(message, error.stack);
      throw new InvalidMetaDataError(message);
    }
  }

  async restoreFromArchive(filename, userId, databaseVersion) {
    const resolvedFilename = path.resolve(filename);
    const archiveName = path.basename(resolvedFilename).replace(/\..+$/, '');
    const restoreDirectory = path.join(this.tempDirectory, archiveName);

    await fs.ensureDir(restoreDirectory);

    await tar.x({
      cwd: restoreDirectory,
      file: resolvedFilename,
    });

    const metaData = await this.readMetaData(restoreDirectory);
    const isFromSelfUser = metaData.user_id === userId;
    const isCompatibleDatabase = metaData.version === databaseVersion;

    if (!isFromSelfUser) {
      const message = `History from user "${metaData.user_id}" cannot be restored for user "${userId}".`;
      throw new DifferentAccountError(message);
    }

    if (!isCompatibleDatabase) {
      throw new IncompatibleBackupError();
    }

    const tableFiles = (await fs.readdir(restoreDirectory)).filter(name => name !== 'export.json');

    const tables = await Promise.all(tableFiles.map(async name => {
      const resolvedName = path.join(restoreDirectory, name);
      const content = await fs.readFile(resolvedName, 'utf8');
      const sanitizedName = name.replace(/\..+$/, '');
      return {content, name: sanitizedName};
    }));

    return tables;
  }
}

module.exports = BackupReader;

const fs = require('fs-extra');
const moment = require('moment');
const path = require('path');
const tar = require('tar');

class BackupManager {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
    this.tempDirectory = path.resolve(this.rootDirectory, '.temp');
  }

  set webappVersion(webappVersion) {
    this._webappVersion = webappVersion;
  }

  saveTable(event, tableName, data) {
    const tempFile = path.join(this.tempDirectory, `${tableName}.txt`);
    console.log(`Writing to file "${tempFile}" ...`);

    if (typeof data === 'number') {
      return fs.remove(tempFile);
    } else {
      return fs.outputFile(tempFile, `${data}\r\n`, {flag: 'a'});
    }
  }

  async restoreFromZip(filename) {
    const buffer = await fs.readFile(resolvedFilename);
    const compressed = new Uint8Array(buffer);
    const restoreDirectory = path.resolve(this.tempDirectory, filename.replace('.tar.gz', ''))

    await fs.ensureDir(tempDirectory);

    await tar.x({
      cwd: this.tempDirectory,
      file: path.resolve(filename),
    });

    const tableFiles = await fs.readdir();

    const tables = await Promise.all(tableFiles.map(filename => {
      const file = path.resolve(restoreDirectory, filename);
      return fs.readFile(file, 'utf8');
    }));

    return tables;
  }

  saveMetaDescription(clientId, userId) {
    const file = path.join(this.tempDirectory, 'descriptor.json');
    const now = new Date();

    // https://github.com/wireapp/architecture/issues/98
    const meta = {
      client_id: clientId,
      creation_time: now.toISOString(),
      platform: 'Web',
      user_id: userId,
      version: this._webappVersion,
    };

    return fs.outputFile(file, JSON.stringify(meta));
  }

  async saveArchiveFile() {
    const timestamp = moment().format('YYYY-MM-DD_HH-MM-SS');
    const backupFiles = await fs.readdir(this.tempDirectory);
    const archiveFilename = path.resolve(this.rootDirectory, `backup-${timestamp}.tar.gz`);

    if (!backupFiles.length) {
      throw new Error(`No files to archive from "${this.tempDirectory}": Directory empty.`)
      return;
    }

    console.log(`Saving archive file "${archiveFilename}" ...`);

    await tar.c({
      cwd: this.tempDirectory,
      gzip: true,
      preservePaths: false,
      file: archiveFilename
    }, backupFiles);
    await fs.remove(this.tempDirectory);

    return archiveFilename;
  }
}

module.exports = BackupManager;

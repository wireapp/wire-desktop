const fs = require('fs-extra');
const path = require('path');

class BackupManager {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  async saveTable(event, tableName, data) {
    const tempFile = path.join(this.rootDirectory, '.temp', `${tableName}.txt`);
    console.log(`Writing to file "${tempFile}" ...`);

    if (typeof data === 'number') {
      return fs.remove(tempFile);
    } else {
      return fs.outputFile(tempFile, `${data}\r\n`, {flag: 'a'});
    }
  }

  async saveMetaDescription(clientId, userId) {
    const file = path.join(this.rootDirectory, 'descriptor.json');
    const now = new Date();

    // https://github.com/wireapp/architecture/issues/98
    const meta = {
      client_id: clientId,
      creation_time: now.toISOString(),
      platform: 'Web',
      user_id: userId,
      version: webappVersion,
    };

    return fs.outputFile(file, JSON.stringify(meta));
  }
}

module.exports = BackupManager;

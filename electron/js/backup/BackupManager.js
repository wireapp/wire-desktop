const os = require('os');
const path = require('path');

class BackupManager {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  async saveTable(event, tableName, data) {
    const tempFile = path.join(this.rootDirectory, '.temp', `${tableName}.txt`);
    console.log(`Writing to file "${tempFile}" ...`);

    try {
      await fs.outputFile(tempFile, `${data}${os.EOL}`, {flag: 'a'});
    } catch (error) {
      event.sender.send('export-error', error);
    }
  }

  async saveMetaDescription(clientId, userId) {
    const file = path.join(this.rootDirectory, 'metadata.json');
    const now = new Date();

    // https://github.com/wireapp/architecture/issues/98
    const meta = {
      client_id: clientId,
      creation_time: now.toISOString(),
      platform: 'Web',
      user_id: userId,
      version: webappVersion,
    };

    return fs.outputFile(file, meta);
  }
}

module.exports = BackupManager;

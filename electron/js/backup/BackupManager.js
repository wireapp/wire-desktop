const os = require('os');
const path = require('path');

class BackupManager {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  async exportTable(event, tableName, data) {
    const tempFile = path.join(this.rootDirectory, '.temp', `${tableName}.txt`);
    console.log(`Writing to file "${tempFile}" ...`);

    try {
      await fs.outputFile(tempFile, `${data}${os.EOL}`, {flag: 'a'});
    } catch (error) {
      event.sender.send('export-error', error);
    }
  }
}

module.exports = BackupManager;

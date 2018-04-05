class BackupImportError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, BackupImportError.prototype);
    this.message = message;
    this.name = this.constructor.name;
    this.stack = new Error().stack;
  }
}

class InvalidMetaDataError extends BackupImportError {
  constructor(message = 'Meta data file is invalid.') {
    super(message);
    this.message = message;
  }
}

module.exports = {
  InvalidMetaDataError,
};

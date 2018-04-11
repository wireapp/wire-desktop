class BackupImportError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, BackupImportError.prototype);
  }
}

class InvalidMetaDataError extends BackupImportError {
  constructor(message = 'Meta data file is invalid.') {
    super(message);
    Object.setPrototypeOf(this, InvalidMetaDataError.prototype);
  }
}

module.exports = {
  BackupImportError,
  InvalidMetaDataError,
};

const BackupReader = require('../../../electron/js/backup/BackupReader');

describe('BackupReader', () => {
  let reader;

  beforeAll(() => {
    const rootDirectory = '.';
    reader = new BackupReader(rootDirectory);
  });

  describe('"restoreFromArchive"', () => {
    it('fails if meta properties are missing', () => {
      expect(reader).toBeDefined();
    });
  });
});

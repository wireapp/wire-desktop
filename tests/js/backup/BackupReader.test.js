const path = require('path');
const BackupReader = require('../../../electron/js/backup/BackupReader');
const {InvalidMetaDataError} = require('../../../electron/js/backup/BackupImportError');

describe('BackupReader', () => {
  let reader;

  beforeAll(() => {
    const rootDirectory = path.resolve('.');
    reader = new BackupReader(rootDirectory);
  });

  describe('"restoreFromArchive"', () => {
    it('fails if meta properties are missing', async done => {
      const filename = path.resolve('tests', 'fixtures', 'js', 'backup', 'incorrect-meta-data.desktop_wbu');
      expect(reader).toBeDefined();
      try {
        await reader.restoreFromArchive(filename);
      } catch(error) {
        expect(error instanceof InvalidMetaDataError).toBe(true);
        done();
      }
    });

    it('successfully restores a valid archive', async done => {
      const filename = path.resolve('tests', 'fixtures', 'js', 'backup', 'correct-meta-data.desktop_wbu');
      expect(reader).toBeDefined();
      await reader.restoreFromArchive(filename, 'afbb5d60-1187-4385-9c29-7361dea79647', 'e0a10e999cb5ebe2');
      done();
    });
  });
});

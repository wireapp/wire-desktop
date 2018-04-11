const path = require('path');
const BackupReader = require('../../../electron/js/backup/BackupReader');
const {InvalidMetaDataError} = require('../../../electron/js/backup/BackupImportError');

describe('BackupReader', () => {
  let reader;

  beforeAll(() => {
    const rootDirectory = path.resolve('.');
    reader = new BackupReader(rootDirectory);
  });

  afterAll(async done => {
    await reader.removeTemp();
    done();
  });

  describe('"restoreFromArchive"', () => {
    it('fails if meta properties are missing', async done => {
      const filename = path.resolve('tests', 'fixtures', 'js', 'backup', 'missing-user_id.desktop_wbu');
      expect(reader).toBeDefined();
      try {
        await reader.restoreFromArchive(filename);
      } catch(error) {
        expect(error instanceof InvalidMetaDataError).toBe(true);
        done();
      }
    });

    it('fails if meta properties are wrong', async done => {
      const filename = path.resolve('tests', 'fixtures', 'js', 'backup', 'wrong-platform.desktop_wbu');
      expect(reader).toBeDefined();
      try {
        await reader.restoreFromArchive(filename);
      } catch(error) {
        expect(error instanceof InvalidMetaDataError).toBe(true);
        done();
      }
    });

    it('fails if meta data file is missing', async done => {
      const filename = path.resolve('tests', 'fixtures', 'js', 'backup', 'missing-meta-data.desktop_wbu');
      expect(reader).toBeDefined();
      try {
        await reader.restoreFromArchive(filename);
      } catch(error) {
        expect(error instanceof InvalidMetaDataError).toBe(true);
        done();
      }
    });

    it('successfully restores an archive without content', async done => {
      const filename = path.resolve('tests', 'fixtures', 'js', 'backup', 'correct-meta-data.desktop_wbu');
      expect(reader).toBeDefined();
      await reader.restoreFromArchive(filename, 'afbb5d60-1187-4385-9c29-7361dea79647', 'e0a10e999cb5ebe2');
      done();
    });

    it('successfully restores a archive with content', async done => {
      const filename = path.resolve('tests', 'fixtures', 'js', 'backup', 'correct-data.desktop_wbu');
      expect(reader).toBeDefined();
      const tables = await reader.restoreFromArchive(filename, 'afbb5d60-1187-4385-9c29-7361dea79647', 'e0a10e999cb5ebe2');
      expect(tables.length).toBeGreaterThan(0);
      done();
    });
  });
});

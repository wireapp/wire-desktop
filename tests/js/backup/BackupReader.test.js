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

const path = require('path');
const BackupReader = require('../../../electron/js/backup/BackupReader');
const {BackupImportError, InvalidMetaDataError} = require('../../../electron/js/backup/BackupImportError');

describe('BackupReader', () => {
  const rootDirectory = path.resolve('.');
  const fixtureDirectory = path.join('tests', 'fixtures', 'js', 'backup');
  let reader;

  beforeAll(() => {
    reader = new BackupReader(rootDirectory);
  });

  afterAll(async done => {
    await reader.removeTemp();
    done();
  });

  describe('"restoreFromArchive"', () => {
    it('fails if meta properties are missing', async done => {
      const filename = path.join(fixtureDirectory, 'missing-user_id.desktop_wbu');
      try {
        await reader.restoreFromArchive(filename);
      } catch(error) {
        expect(error instanceof InvalidMetaDataError).toBe(true);
        expect(error instanceof BackupImportError).toBe(true);
        done();
      }
    });

    it('fails if meta properties are wrong', async done => {
      const filename = path.join(fixtureDirectory, 'wrong-platform.desktop_wbu');
      try {
        await reader.restoreFromArchive(filename);
      } catch(error) {
        expect(error instanceof InvalidMetaDataError).toBe(true);
        done();
      }
    });

    it('fails if meta data file is missing', async done => {
      const filename = path.join(fixtureDirectory, 'missing-meta-data.desktop_wbu');
      try {
        await reader.restoreFromArchive(filename);
      } catch(error) {
        expect(error instanceof InvalidMetaDataError).toBe(true);
        done();
      }
    });

    it('successfully restores an archive without content', async done => {
      const filename = path.join(fixtureDirectory, 'correct-meta-data.desktop_wbu');
      await reader.restoreFromArchive(filename, 'afbb5d60-1187-4385-9c29-7361dea79647', 'e0a10e999cb5ebe2');
      done();
    });

    it('successfully restores a archive with content', async done => {
      const filename = path.join(fixtureDirectory, 'correct-data.desktop_wbu');
      const tables = await reader.restoreFromArchive(filename, 'afbb5d60-1187-4385-9c29-7361dea79647', 'e0a10e999cb5ebe2');
      expect(tables.length).toBeGreaterThan(0);
      done();
    });
  });
});

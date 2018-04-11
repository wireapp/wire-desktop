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

const fs = require('fs-extra');
const path = require('path');
const BackupWriter = require('../../../electron/js/backup/BackupWriter');

describe('BackupWriter', () => {
  const rootDirectory = path.resolve('.');
  let writer;

  afterAll(async done => {
    await writer.removeTemp();
    done();
  });

  describe('"saveArchiveFile"', () => {
    it('fails if the path is not writeable', async done => {
      writer = new BackupWriter('/', 0, 'error.desktop_wbu');

      try {
        await writer.saveArchiveFile();
      } catch(error) {
        expect(error.code).toBe('ENOENT');
        done();
      }
    });

    it('fails if not all batches were exported', async done => {
      writer = new BackupWriter(rootDirectory, 1, 'backup.desktop_wbu');

      try {
        await writer.saveArchiveFile();
      } catch(error) {
        done();
      }
    });

    it('successfully exports data', async done => {
      const tempDir = path.join(rootDirectory, '.temp2');
      await fs.ensureDir(tempDir);

      writer = new BackupWriter(rootDirectory, 1, path.join(tempDir, 'backup.desktop_wbu'));
      await writer.saveBatch('conversations', {});
      await writer.saveMetaDescription({});
      await writer.saveArchiveFile();

      const exportedFiles = await fs.readdir(tempDir);
      expect(exportedFiles[0]).toBe('backup.desktop_wbu');

      await fs.remove(tempDir);

      done();
    });
  });
});

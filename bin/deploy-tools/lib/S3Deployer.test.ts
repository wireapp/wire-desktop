/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import fs from 'fs-extra';

import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';

import {S3Deployer} from './S3Deployer';

describe('S3Deployer', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map(directory => fs.remove(directory)));
  });

  describe('copyOnS3', () => {
    it(`doesn't upload anything if dry run is set`, async () => {
      const s3Deployer = new S3Deployer({
        accessKeyId: '',
        dryRun: true,
        secretAccessKey: '',
      });

      await assert.doesNotReject(() => s3Deployer.copyOnS3({bucket: '', s3FromPath: '', s3ToPath: ''}));
    });
  });

  describe('findUploadFiles', () => {
    it('selects the requested native MSI when Squirrel artifacts are also present', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-msi-deployer-'));
      temporaryDirectories.push(basePath);
      const fileName = 'Wire-3.42.123-x64.msi';
      await fs.ensureFile(path.join(basePath, fileName));
      await fs.ensureFile(path.join(basePath, 'Wire-3.42.122-x64.msi'));
      await fs.ensureFile(path.join(basePath, 'Wire-Setup.exe'));
      await fs.ensureFile(path.join(basePath, 'Wire-3.42.123-full.nupkg'));
      await fs.ensureFile(path.join(basePath, 'RELEASES'));
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      const files = await s3Deployer.findUploadFiles('wrapper_windows_production', basePath, '3.42.123', 'msi');

      assert.deepStrictEqual(files, [{fileName, filePath: path.join(basePath, fileName)}]);
    });

    it('selects Squirrel artifacts when an MSI is also present', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-squirrel-deployer-'));
      temporaryDirectories.push(basePath);
      await fs.ensureFile(path.join(basePath, 'Wire-3.42.123-x64.msi'));
      await fs.ensureFile(path.join(basePath, 'Wire-Setup.exe'));
      await fs.ensureFile(path.join(basePath, 'Wire-3.42.123-full.nupkg'));
      await fs.ensureFile(path.join(basePath, 'RELEASES'));
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      const files = await s3Deployer.findUploadFiles('wrapper_windows_production', basePath, '3.42.123', 'squirrel');

      assert.deepStrictEqual(files, [
        {
          fileName: 'Wire-3.42.123-full.nupkg',
          filePath: path.join(basePath, 'Wire-3.42.123-full.nupkg'),
        },
        {fileName: 'Wire-3.42.123-RELEASES', filePath: path.join(basePath, 'RELEASES')},
        {fileName: 'Wire-3.42.123.exe', filePath: path.join(basePath, 'Wire-Setup.exe')},
      ]);
    });
  });
});

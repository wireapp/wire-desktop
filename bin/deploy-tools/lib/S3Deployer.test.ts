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

import {
  getWindowsMsiAliasCopyOptions,
  getWindowsMsiSetupFileName,
  S3Deployer,
} from './S3Deployer';

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
      const aliasCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName: 'Wire-3.44.5380-x64.msi',
        version: '3.44.5380',
        versionedS3Path: 'win/prod/Wire-3.44.5380-x64.msi',
      });

      await assert.doesNotReject(() =>
        Promise.all(aliasCopyOptions.map(copyOptions => s3Deployer.copyOnS3(copyOptions))),
      );
    });
  });

  describe('findUploadFiles', () => {
    it('selects the requested native MSI when Squirrel artifacts are also present', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-msi-deployer-'));
      temporaryDirectories.push(basePath);
      const fileName = 'Wire-3.42.123-x64.msi';
      await fs.ensureFile(path.join(basePath, fileName));
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

    it('rejects ambiguous automatic selection when both Windows installer families are present', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-ambiguous-deployer-'));
      temporaryDirectories.push(basePath);
      await fs.ensureFile(path.join(basePath, 'Wire-3.42.123-x64.msi'));
      await fs.ensureFile(path.join(basePath, 'Wire-Setup.exe'));
      await fs.ensureFile(path.join(basePath, 'Wire-3.42.123-full.nupkg'));
      await fs.ensureFile(path.join(basePath, 'RELEASES'));
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      await assert.rejects(
        s3Deployer.findUploadFiles('wrapper_windows_production', basePath, '3.42.123'),
        /contains both Squirrel and MSI artifacts; select one explicitly/,
      );
    });

    it('selects the macOS package', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-macos-deployer-'));
      temporaryDirectories.push(basePath);
      const fileName = 'Wire-3.42.123.pkg';
      await fs.ensureFile(path.join(basePath, fileName));
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      const files = await s3Deployer.findUploadFiles('wrapper_macos_production', basePath, '3.42.123');

      assert.deepStrictEqual(files, [{fileName, filePath: path.join(basePath, fileName)}]);
    });

    it('rejects Linux artifacts', async () => {
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      await assert.rejects(
        s3Deployer.findUploadFiles('wrapper_linux_production', '/unused', '3.42.123'),
        /Invalid platform "wrapper_linux_production"/,
      );
    });
  });

  describe('getWindowsMsiSetupFileName', () => {
    it('creates an architecture-specific latest MSI alias', () => {
      assert.strictEqual(
        getWindowsMsiSetupFileName('Wire-3.42.123-x64.msi', '3.42.123'),
        'Wire-x64-Setup.msi',
      );
    });

    it('rejects an unexpected MSI filename', () => {
      assert.throws(
        () => getWindowsMsiSetupFileName('Wire-x64-Setup.msi', '3.42.123'),
        /Could not derive the stable MSI name/,
      );
    });

    function assertX64AliasesMatchProductName(productName: string): void {
      const fileName = `${productName}-3.44.5380-x64.msi`;
      const aliasCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName,
        version: '3.44.5380',
        versionedS3Path: `win/prod/${fileName}`,
      });
      const actualAliasFileNames = aliasCopyOptions.map(copyOptions =>
        copyOptions.s3ToPath.slice(copyOptions.s3ToPath.lastIndexOf('/') + 1),
      );
      const expectedAliasFileNames = [`${productName}-x64-Setup.msi`, `${productName}-Setup.msi`];

      assert.deepStrictEqual(actualAliasFileNames, expectedAliasFileNames);
      assert.strictEqual(getWindowsMsiSetupFileName(fileName, '3.44.5380'), `${productName}-x64-Setup.msi`);
    }

    it('derives the production Wire aliases', () => {
      assertX64AliasesMatchProductName('Wire');
    });
    it('derives the Internal aliases', () => {
      assertX64AliasesMatchProductName('WireInternal');
    });
    it('derives the Wire-Gov aliases', () => {
      assertX64AliasesMatchProductName('WireGov');
    });
    it('derives aliases for a custom product name', () => {
      assertX64AliasesMatchProductName('Example-Company');
    });

    function assertOnlyArchitectureSpecificAlias(architecture: 'ia32' | 'arm64'): void {
      const fileName = `Wire-3.44.5380-${architecture}.msi`;
      const aliasCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName,
        version: '3.44.5380',
        versionedS3Path: `win/prod/${fileName}`,
      });

      assert.strictEqual(aliasCopyOptions.length, 1);
      assert.strictEqual(aliasCopyOptions[0].s3ToPath, `win/prod/Wire-${architecture}-Setup.msi`);
    }

    it('does not derive a generic alias for ia32 installers', () => {
      assertOnlyArchitectureSpecificAlias('ia32');
    });
    it('does not derive a generic alias for arm64 installers', () => {
      assertOnlyArchitectureSpecificAlias('arm64');
    });

    it('rejects an MSI filename whose version does not match the deployment', () => {
      assert.throws(
        () => getWindowsMsiSetupFileName('Wire-3.44.5379-x64.msi', '3.44.5380'),
        /Could not derive the stable MSI name/,
      );
    });
  });

  describe('getWindowsMsiAliasCopyOptions', () => {
    it('copies the x64 aliases from the versioned S3 artifact under the same prefix', () => {
      const actualCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName: 'Wire-3.44.5380-x64.msi',
        version: '3.44.5380',
        versionedS3Path: 'win/prod/Wire-3.44.5380-x64.msi',
      });
      const expectedCopyOptions = [
        {
          bucket: 'wire-taco',
          s3FromPath: 'wire-taco/win/prod/Wire-3.44.5380-x64.msi',
          s3ToPath: 'win/prod/Wire-x64-Setup.msi',
        },
        {
          bucket: 'wire-taco',
          s3FromPath: 'wire-taco/win/prod/Wire-3.44.5380-x64.msi',
          s3ToPath: 'win/prod/Wire-Setup.msi',
        },
      ];

      assert.deepStrictEqual(actualCopyOptions, expectedCopyOptions);
    });

    it('keeps only the architecture-specific alias for non-x64 MSI copies', () => {
      const actualCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName: 'WireInternal-3.44.5380-ia32.msi',
        version: '3.44.5380',
        versionedS3Path: 'win/internal/WireInternal-3.44.5380-ia32.msi',
      });

      assert.deepStrictEqual(actualCopyOptions, [
        {
          bucket: 'wire-taco',
          s3FromPath: 'wire-taco/win/internal/WireInternal-3.44.5380-ia32.msi',
          s3ToPath: 'win/internal/WireInternal-ia32-Setup.msi',
        },
      ]);
    });

    it('rejects a versioned S3 source path that names a different artifact', () => {
      assert.throws(
        () =>
          getWindowsMsiAliasCopyOptions({
            bucket: 'wire-taco',
            fileName: 'Wire-3.44.5380-x64.msi',
            version: '3.44.5380',
            versionedS3Path: 'win/prod/Wire-3.44.5379-x64.msi',
          }),
        /does not match artifact/,
      );
    });
  });
});

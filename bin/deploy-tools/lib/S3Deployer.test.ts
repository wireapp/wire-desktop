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

import {publishWindowsSquirrelRelease} from './publish-windows-squirrel-release';
import {
  copyWindowsMsiAliases,
  getWindowsMsiAliasCopyOptions,
  getWindowsMsiSetupFileName,
  S3Deployer,
  windowsReleaseAliasCacheControl,
} from './S3Deployer';
import type {S3Client} from './S3Deployer';

describe('S3Deployer', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map(directory => {
        return fs.remove(directory);
      }),
    );
  });

  describe('copyOnS3', () => {
    it('preserves source metadata and the public ACL on stable Windows MSI copies', async () => {
      const metadataRequests: Parameters<S3Client['headObject']>[0][] = [];
      const copyRequests: Parameters<S3Client['copyObject']>[0][] = [];
      const s3Client: S3Client = {
        copyObject: request => {
          copyRequests.push(request);
          return {
            promise: async () => {
              return {};
            },
          };
        },
        headObject: request => {
          metadataRequests.push(request);
          return {
            promise: async () => {
              return {
                CacheControl: 'public, max-age=86400',
                ContentType: 'application/octet-stream',
                ContentDisposition: 'attachment',
                Metadata: {release: '3.44.5380'},
              };
            },
          };
        },
        deleteObject: () => {
          return assert.fail('Unexpected delete');
        },
        upload: () => {
          return assert.fail('Unexpected upload');
        },
      };
      const s3Deployer = new S3Deployer({accessKeyId: '', secretAccessKey: ''}, s3Client);
      const bucket = 'wire-taco';
      const versionedMsiPath = 'win/prod/Wire-3.44.5380-x64.msi';

      await copyWindowsMsiAliases({
        aliasCopyOptions: getWindowsMsiAliasCopyOptions({
          bucket,
          fileName: 'Wire-3.44.5380-x64.msi',
          version: '3.44.5380',
          versionedS3Path: versionedMsiPath,
        }),
        copyOnS3: copyOptions => {
          return s3Deployer.copyOnS3(copyOptions);
        },
      });

      assert.deepStrictEqual(metadataRequests, [
        {Bucket: bucket, Key: versionedMsiPath},
        {Bucket: bucket, Key: versionedMsiPath},
      ]);
      const expectedAliasKeys = ['win/prod/Wire-x64-Setup.msi', 'win/prod/Wire-Setup.msi'];
      assert.strictEqual(copyRequests.length, expectedAliasKeys.length);
      for (const [index, aliasKey] of expectedAliasKeys.entries()) {
        assert.deepStrictEqual(copyRequests[index], {
          ACL: 'public-read',
          Bucket: bucket,
          CacheControl: 'public, max-age=300, s-maxage=300',
          ContentDisposition: 'attachment',
          ContentEncoding: undefined,
          ContentLanguage: undefined,
          ContentType: 'application/octet-stream',
          CopySource: `${bucket}/${versionedMsiPath}`,
          Expires: undefined,
          Key: aliasKey,
          Metadata: {release: '3.44.5380'},
          MetadataDirective: 'REPLACE',
          WebsiteRedirectLocation: undefined,
        });
      }

      await s3Deployer.copyOnS3({
        bucket,
        s3FromPath: `${bucket}/mac/prod/Source.pkg`,
        s3ToPath: 'mac/prod/Copy.pkg',
      });
      assert.strictEqual(metadataRequests.length, 2);
      assert.deepStrictEqual(copyRequests[2], {
        ACL: 'public-read',
        Bucket: bucket,
        CopySource: `${bucket}/mac/prod/Source.pkg`,
        Key: 'mac/prod/Copy.pkg',
      });
    });

    it('skips S3 requests for cached and ordinary copies during a dry run', async () => {
      const s3Deployer = new S3Deployer(
        {accessKeyId: '', dryRun: true, secretAccessKey: ''},
        {
          copyObject: () => {
            return assert.fail('Unexpected copy');
          },
          deleteObject: () => {
            return assert.fail('Unexpected delete');
          },
          headObject: () => {
            return assert.fail('Unexpected metadata lookup');
          },
          upload: () => {
            return assert.fail('Unexpected upload');
          },
        },
      );
      const aliasCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName: 'Wire-3.44.5380-x64.msi',
        version: '3.44.5380',
        versionedS3Path: 'win/prod/Wire-3.44.5380-x64.msi',
      });

      await assert.doesNotReject(() => {
        return Promise.all(
          aliasCopyOptions.map(copyOptions => {
            return s3Deployer.copyOnS3(copyOptions);
          }),
        );
      });
      await s3Deployer.copyOnS3({
        bucket: 'wire-taco',
        s3FromPath: 'wire-taco/mac/prod/Source.pkg',
        s3ToPath: 'mac/prod/Copy.pkg',
      });
      await publishWindowsSquirrelRelease({
        bucket: 'wire-taco',
        copyOnS3: copyOptions => {
          return s3Deployer.copyOnS3(copyOptions);
        },
        s3Prefix: 'win/prod',
        setupName: 'Wire-Setup.exe',
        versionedName: 'wire-3.44.5380',
      });
    });

    it('propagates a failed S3 alias copy', async () => {
      const s3Client: S3Client = {
        headObject: () => {
          return {
            promise: async () => {
              return {ContentType: 'application/octet-stream'};
            },
          };
        },
        copyObject: () => {
          return {
            promise: async () => {
              throw new Error('S3 copy failed');
            },
          };
        },
        deleteObject: () => {
          return {
            promise: async () => {
              return Promise.resolve();
            },
          };
        },
        upload: () => {
          return {
            promise: async () => {
              return Promise.resolve();
            },
          };
        },
      };
      const s3Deployer = new S3Deployer({accessKeyId: '', secretAccessKey: ''}, s3Client);

      await assert.rejects(
        s3Deployer.copyOnS3({
          bucket: 'wire-taco',
          cacheControl: windowsReleaseAliasCacheControl,
          s3FromPath: 'wire-taco/win/prod/Wire-3.44.5380-x64.msi',
          s3ToPath: 'win/prod/Wire-Setup.msi',
        }),
        /S3 copy failed/,
      );
    });

    it('fails the alias publication when source metadata cannot be read', async () => {
      const s3Deployer = new S3Deployer(
        {accessKeyId: '', secretAccessKey: ''},
        {
          copyObject: () => {
            return assert.fail('Unexpected copy after failed metadata lookup');
          },
          deleteObject: () => {
            return assert.fail('Unexpected delete');
          },
          headObject: () => {
            return {
              promise: async () => {
                throw new Error('S3 metadata lookup failed');
              },
            };
          },
          upload: () => {
            return assert.fail('Unexpected upload');
          },
        },
      );

      await assert.rejects(
        s3Deployer.copyOnS3({
          bucket: 'wire-taco',
          cacheControl: windowsReleaseAliasCacheControl,
          s3FromPath: 'wire-taco/win/prod/wire-3.44.5380.exe',
          s3ToPath: 'win/prod/Wire-Setup.exe',
        }),
        /S3 metadata lookup failed/,
      );
    });
  });

  describe('publishWindowsSquirrelRelease', () => {
    const releaseEnvironments = [
      {
        bucket: 'wire-taco',
        s3Prefix: 'win/prod',
        expectedDirectory: 'win/prod/',
        encodedDirectory: 'win/prod/',
        setupName: 'Wire-Setup.exe',
        versionedName: 'wire-3.44.5380',
      },
      {
        bucket: 'wire-taco',
        s3Prefix: 'win/internal',
        expectedDirectory: 'win/internal/',
        encodedDirectory: 'win/internal/',
        setupName: 'WireInternal-Setup.exe',
        versionedName: 'wireinternal-3.44.5380',
      },
      {
        bucket: 'wire-taco',
        s3Prefix: 'win/wire-gov',
        expectedDirectory: 'win/wire-gov/',
        encodedDirectory: 'win/wire-gov/',
        setupName: 'WireGov-Setup.exe',
        versionedName: 'wiregov-3.44.5380',
      },
      {
        bucket: 'custom-windows-bucket',
        s3Prefix: 'windows/custom releases///',
        expectedDirectory: 'windows/custom releases/',
        encodedDirectory: 'windows/custom%20releases/',
        setupName: 'WireEY-Setup.exe',
        versionedName: 'wire-ey-3.44.5380',
      },
      {
        bucket: 'custom-windows-bucket',
        s3Prefix: '',
        expectedDirectory: '',
        encodedDirectory: '',
        setupName: 'WireEY-Setup.exe',
        versionedName: 'wire-ey-3.44.5380',
      },
      {
        bucket: 'custom-windows-bucket',
        s3Prefix: undefined,
        expectedDirectory: '',
        encodedDirectory: '',
        setupName: 'WireEY-Setup.exe',
        versionedName: 'wire-ey-3.44.5380',
      },
    ];

    for (const {
      bucket,
      s3Prefix,
      expectedDirectory,
      encodedDirectory,
      setupName,
      versionedName,
    } of releaseEnvironments) {
      it(`overwrites the stable feed and setup alias in order for ${bucket}/${s3Prefix}`, async () => {
        const feedMetadata = {
          ContentType: 'text/plain',
          ContentDisposition: 'inline',
          Metadata: {artifact: 'squirrel-feed'},
        };
        const setupMetadata = {
          ContentType: 'application/octet-stream',
          ContentDisposition: `attachment; filename="${setupName}"`,
          Metadata: {artifact: 'squirrel-setup'},
        };
        const metadataRequests: Parameters<S3Client['headObject']>[0][] = [];
        const copyRequests: Parameters<S3Client['copyObject']>[0][] = [];
        const s3Deployer = new S3Deployer(
          {accessKeyId: '', secretAccessKey: ''},
          {
            headObject: request => {
              metadataRequests.push(request);
              return {
                promise: async () => {
                  return request.Key.endsWith('-RELEASES') ? feedMetadata : setupMetadata;
                },
              };
            },
            copyObject: request => {
              copyRequests.push(request);
              return {
                promise: async () => {
                  return {};
                },
              };
            },
            deleteObject: () => {
              return assert.fail('Expected in-place replacement');
            },
            upload: () => {
              return assert.fail('Expected versioned artifacts to be read only');
            },
          },
        );

        await publishWindowsSquirrelRelease({
          bucket,
          copyOnS3: copyOptions => {
            return s3Deployer.copyOnS3(copyOptions);
          },
          s3Prefix,
          setupName,
          versionedName,
        });

        assert.deepStrictEqual(metadataRequests, [
          {Bucket: bucket, Key: `${expectedDirectory}${versionedName}-RELEASES`},
          {Bucket: bucket, Key: `${expectedDirectory}${versionedName}.exe`},
        ]);
        const expectedAliases = [
          {
            aliasFileName: 'RELEASES',
            metadata: feedMetadata,
            versionedFileName: `${versionedName}-RELEASES`,
          },
          {
            aliasFileName: setupName,
            metadata: setupMetadata,
            versionedFileName: `${versionedName}.exe`,
          },
        ];
        assert.strictEqual(copyRequests.length, expectedAliases.length);
        for (const [index, alias] of expectedAliases.entries()) {
          assert.deepStrictEqual(copyRequests[index], {
            ACL: 'public-read',
            Bucket: bucket,
            CacheControl: 'public, max-age=300, s-maxage=300',
            ContentDisposition: alias.metadata.ContentDisposition,
            ContentEncoding: undefined,
            ContentLanguage: undefined,
            ContentType: alias.metadata.ContentType,
            CopySource: `${bucket}/${encodedDirectory}${alias.versionedFileName}`,
            Expires: undefined,
            Key: `${expectedDirectory}${alias.aliasFileName}`,
            Metadata: alias.metadata.Metadata,
            MetadataDirective: 'REPLACE',
            WebsiteRedirectLocation: undefined,
          });
        }
      });
    }

    it('propagates a failed feed copy and stops before publishing the setup alias', async () => {
      const attemptedKeys: string[] = [];
      const s3Deployer = new S3Deployer(
        {accessKeyId: '', secretAccessKey: ''},
        {
          headObject: () => {
            return {
              promise: async () => {
                return {ContentType: 'text/plain'};
              },
            };
          },
          copyObject: request => {
            attemptedKeys.push(request.Key);
            return {
              promise: async () => {
                throw new Error('S3 copy failed');
              },
            };
          },
          deleteObject: () => {
            return assert.fail('The previous feed must stay available');
          },
          upload: () => {
            return assert.fail('Unexpected upload');
          },
        },
      );

      await assert.rejects(
        publishWindowsSquirrelRelease({
          bucket: 'wire-taco',
          copyOnS3: copyOptions => {
            return s3Deployer.copyOnS3(copyOptions);
          },
          s3Prefix: 'win/prod',
          setupName: 'Wire-Setup.exe',
          versionedName: 'wire-3.44.5380',
        }),
        /S3 copy failed/,
      );
      assert.deepStrictEqual(attemptedKeys, ['win/prod/RELEASES']);
    });
  });

  describe('uploadToS3', () => {
    it('keeps versioned artifact upload metadata and propagates a failed S3 upload', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-failed-msi-upload-'));
      temporaryDirectories.push(basePath);
      const filePath = path.join(basePath, 'Wire-3.44.5380-x64.msi');
      await fs.writeFile(filePath, 'signed MSI bytes');
      const uploadRequests: Parameters<S3Client['upload']>[0][] = [];
      const s3Client: S3Client = {
        headObject: () => {
          return assert.fail('Unexpected metadata lookup');
        },
        copyObject: () => {
          return {
            promise: async () => {
              return Promise.resolve();
            },
          };
        },
        deleteObject: () => {
          return {
            promise: async () => {
              return Promise.resolve();
            },
          };
        },
        upload: request => {
          uploadRequests.push(request);
          return {
            promise: async () => {
              throw new Error('S3 upload failed');
            },
          };
        },
      };
      const s3Deployer = new S3Deployer({accessKeyId: '', secretAccessKey: ''}, s3Client);

      await assert.rejects(
        s3Deployer.uploadToS3({
          bucket: 'wire-taco',
          filePath,
          s3Path: 'win/prod/Wire-3.44.5380-x64.msi',
        }),
        /S3 upload failed/,
      );
      assert.strictEqual(uploadRequests.length, 1);
      const {Body} = uploadRequests[0];
      assert.ok(Body);
      assert.deepStrictEqual(uploadRequests[0], {
        ACL: 'public-read',
        Body,
        Bucket: 'wire-taco',
        Key: 'win/prod/Wire-3.44.5380-x64.msi',
      });
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

    it('requires an MSI when the deployment explicitly selects MSI artifacts', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-missing-msi-deployer-'));
      temporaryDirectories.push(basePath);
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      await assert.rejects(
        s3Deployer.findUploadFiles('wrapper_windows_production', basePath, '3.42.123', 'msi'),
        /Could not find an MSI for version "3.42.123"/,
      );
    });

    it('fails when the exact expected production MSI is missing', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-missing-production-msi-'));
      temporaryDirectories.push(basePath);
      const expectedMsiFileName = 'Wire-3.42.123-x64.msi';
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      await assert.rejects(
        s3Deployer.findUploadFiles('wrapper_windows_production', basePath, '3.42.123', {
          expectedMsiFileName,
          type: 'msi',
        }),
        /Could not find required Windows MSI artifact "Wire-3\.42\.123-x64\.msi"/,
      );
    });

    it('selects the exact expected production MSI when other MSI architectures are present', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-production-msi-deployer-'));
      temporaryDirectories.push(basePath);
      const expectedWindowsMsiFileName = 'Wire-3.42.123-x64.msi';
      await fs.ensureFile(path.join(basePath, expectedWindowsMsiFileName));
      await fs.ensureFile(path.join(basePath, 'Wire-3.42.123-ia32.msi'));
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      const actualFiles = await s3Deployer.findUploadFiles('wrapper_windows_production', basePath, '3.42.123', {
        expectedMsiFileName: expectedWindowsMsiFileName,
        type: 'msi',
      });
      const expectedFiles = [
        {fileName: expectedWindowsMsiFileName, filePath: path.join(basePath, expectedWindowsMsiFileName)},
      ];

      assert.deepStrictEqual(actualFiles, expectedFiles);
    });

    it('rejects an expected production MSI filename for another version', async () => {
      const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-wrong-version-msi-deployer-'));
      temporaryDirectories.push(basePath);
      const s3Deployer = new S3Deployer({accessKeyId: '', dryRun: true, secretAccessKey: ''});

      await assert.rejects(
        s3Deployer.findUploadFiles('wrapper_windows_production', basePath, '3.42.123', {
          expectedMsiFileName: 'Wire-3.42.122-x64.msi',
          type: 'msi',
        }),
        /Could not derive the stable MSI name/,
      );
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
      assert.strictEqual(getWindowsMsiSetupFileName('Wire-3.42.123-x64.msi', '3.42.123'), 'Wire-x64-Setup.msi');
    });

    it('rejects an unexpected MSI filename', () => {
      assert.throws(() => {
        return getWindowsMsiSetupFileName('Wire-x64-Setup.msi', '3.42.123');
      }, /Could not derive the stable MSI name/);
    });

    function assertX64AliasesMatchProductName(productName: string): void {
      const fileName = `${productName}-3.44.5380-x64.msi`;
      const aliasCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName,
        version: '3.44.5380',
        versionedS3Path: `win/prod/${fileName}`,
      });
      const actualAliasFileNames = aliasCopyOptions.map(copyOptions => {
        return copyOptions.s3ToPath.slice(copyOptions.s3ToPath.lastIndexOf('/') + 1);
      });
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
      assert.throws(() => {
        return getWindowsMsiSetupFileName('Wire-3.44.5379-x64.msi', '3.44.5380');
      }, /Could not derive the stable MSI name/);
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
          cacheControl: 'public, max-age=300, s-maxage=300',
          s3FromPath: 'wire-taco/win/prod/Wire-3.44.5380-x64.msi',
          s3ToPath: 'win/prod/Wire-x64-Setup.msi',
        },
        {
          bucket: 'wire-taco',
          cacheControl: 'public, max-age=300, s-maxage=300',
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
          cacheControl: 'public, max-age=300, s-maxage=300',
          s3FromPath: 'wire-taco/win/internal/WireInternal-3.44.5380-ia32.msi',
          s3ToPath: 'win/internal/WireInternal-ia32-Setup.msi',
        },
      ]);
    });

    it('rejects a versioned S3 source path that names a different artifact', () => {
      assert.throws(() => {
        return getWindowsMsiAliasCopyOptions({
          bucket: 'wire-taco',
          fileName: 'Wire-3.44.5380-x64.msi',
          version: '3.44.5380',
          versionedS3Path: 'win/prod/Wire-3.44.5379-x64.msi',
        });
      }, /does not match artifact/);
    });

    it('fails deployment when publishing a required MSI alias fails', async () => {
      const aliasCopyOptions = getWindowsMsiAliasCopyOptions({
        bucket: 'wire-taco',
        fileName: 'Wire-3.44.5380-x64.msi',
        version: '3.44.5380',
        versionedS3Path: 'win/prod/Wire-3.44.5380-x64.msi',
      });
      const attemptedAliasPaths: string[] = [];

      await assert.rejects(
        copyWindowsMsiAliases({
          aliasCopyOptions,
          copyOnS3: async copyOptions => {
            attemptedAliasPaths.push(copyOptions.s3ToPath);
            if (copyOptions.s3ToPath.endsWith('Wire-Setup.msi')) {
              throw new Error('S3 copy failed');
            }
          },
        }),
        /Failed to publish required Windows MSI alias "win\/prod\/Wire-Setup\.msi": S3 copy failed/,
      );

      assert.deepStrictEqual(attemptedAliasPaths, ['win/prod/Wire-x64-Setup.msi', 'win/prod/Wire-Setup.msi']);
    });
  });
});

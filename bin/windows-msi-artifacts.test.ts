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

import {createHash} from 'node:crypto';
import fs from 'fs-extra';

import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';

import {createWindowsMsiGenericSetupAlias, getWindowsMsiSetupAliasNames} from './windows-msi-artifacts';

describe('Windows MSI artifacts', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryDirectories.splice(0).map(directory => fs.remove(directory)));
  });

  describe('getWindowsMsiSetupAliasNames', () => {
    it('uses the product name for generic and architecture-specific x64 aliases', () => {
      const actualNames = getWindowsMsiSetupAliasNames({
        expectedVersion: '3.44.5380',
        fileName: 'WireInternal-3.44.5380-x64.msi',
      });
      assert.strictEqual(actualNames.architectureSpecificFileName, 'WireInternal-x64-Setup.msi');
      assert.ok(actualNames.genericFileName.isJust);
      assert.strictEqual(actualNames.genericFileName.value, 'WireInternal-Setup.msi');
    });

    it('keeps the architecture-specific alias and omits the generic alias for non-x64 packages', () => {
      const actualNames = getWindowsMsiSetupAliasNames({
        expectedVersion: '3.44.5380',
        fileName: 'WireGov-3.44.5380-arm64.msi',
      });

      assert.strictEqual(actualNames.architectureSpecificFileName, 'WireGov-arm64-Setup.msi');
      assert.ok(actualNames.genericFileName.isNothing);
    });

    it('rejects malformed MSI filenames and mismatched versions', () => {
      for (const fileName of [
        'Wire-3..44-x64.msi',
        'Wire-3.44.5380-x86.msi',
        'Wire-3.44.5380-x64.msi.backup',
        '../Wire-3.44.5380-x64.msi',
      ]) {
        assert.throws(() => getWindowsMsiSetupAliasNames({fileName}), /Could not derive the stable MSI name/);
      }

      assert.throws(
        () => getWindowsMsiSetupAliasNames({expectedVersion: '3.44.5380', fileName: 'Wire-3.44.5379-x64.msi'}),
        /Could not derive the stable MSI name/,
      );
    });
  });

  describe('createWindowsMsiGenericSetupAlias', () => {
    it('copies the final x64 MSI without changing either file', async () => {
      const distDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-msi-alias-'));
      temporaryDirectories.push(distDirectory);
      const versionedMsiFileName = 'Wire-3.44.5380-x64.msi';
      const versionedMsiFilePath = path.join(distDirectory, versionedMsiFileName);
      const originalMsiBytes = Buffer.from('signed MSI payload and timestamp bytes');
      await fs.writeFile(versionedMsiFilePath, originalMsiBytes);

      const genericMsiFilePath = await createWindowsMsiGenericSetupAlias({
        distDirectory,
        expectedVersion: '3.44.5380',
      });

      assert.ok(genericMsiFilePath.isJust);
      assert.strictEqual(genericMsiFilePath.value, path.join(distDirectory, 'Wire-Setup.msi'));
      const actualSourceHash = createHash('sha256').update(await fs.readFile(versionedMsiFilePath)).digest('hex');
      const actualAliasHash = createHash('sha256').update(await fs.readFile(genericMsiFilePath.value)).digest('hex');
      const expectedHash = createHash('sha256').update(originalMsiBytes).digest('hex');
      assert.strictEqual(actualSourceHash, expectedHash);
      assert.strictEqual(actualAliasHash, expectedHash);
      assert.deepStrictEqual(await fs.readFile(versionedMsiFilePath), originalMsiBytes);
    });

    it('does not create a generic alias for an x86 package', async () => {
      const distDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-msi-alias-'));
      temporaryDirectories.push(distDirectory);
      await fs.writeFile(path.join(distDirectory, 'Wire-3.44.5380-ia32.msi'), 'x86 MSI payload');

      const actualAliasPath = await createWindowsMsiGenericSetupAlias({
        distDirectory,
        expectedVersion: '3.44.5380',
      });

      assert.ok(actualAliasPath.isNothing);
      assert.strictEqual(await fs.pathExists(path.join(distDirectory, 'Wire-Setup.msi')), false);
    });

    it('rejects an MSI whose version does not match the expected release', async () => {
      const distDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wire-msi-alias-'));
      temporaryDirectories.push(distDirectory);
      await fs.writeFile(path.join(distDirectory, 'Wire-3.44.5379-x64.msi'), 'MSI payload');

      await assert.rejects(
        createWindowsMsiGenericSetupAlias({distDirectory, expectedVersion: '3.44.5380'}),
        /Could not derive the stable MSI name/,
      );
    });
  });
});

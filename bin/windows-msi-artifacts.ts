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
import {Maybe} from 'true-myth';

import path from 'path';

export type WindowsMsiArchitecture = 'x64' | 'ia32' | 'arm64';

export interface WindowsMsiSetupAliasNamesOptions {
  expectedVersion?: string;
  fileName: string;
}

export interface WindowsMsiSetupAliasNames {
  architectureSpecificFileName: string;
  genericFileName: Maybe<string>;
}

export interface CreateWindowsMsiGenericSetupAliasOptions {
  distDirectory: string;
  expectedVersion: string;
}

export function getWindowsMsiSetupAliasNames({
  expectedVersion,
  fileName,
}: WindowsMsiSetupAliasNamesOptions): WindowsMsiSetupAliasNames {
  const match = /^([^/\\]+)-(\d+(?:\.\d+)*)-(x64|ia32|arm64)\.msi$/.exec(fileName);

  if (!match || (expectedVersion !== undefined && match[2] !== expectedVersion)) {
    throw new Error(`Could not derive the stable MSI name from "${fileName}".`);
  }

  const productName = match[1];
  const architecture = match[3] as WindowsMsiArchitecture;
  return {
    architectureSpecificFileName: `${productName}-${architecture}-Setup.msi`,
    genericFileName:
      architecture === 'x64' ? Maybe.just(`${productName}-Setup.msi`) : Maybe.nothing<string>(),
  };
}

export async function createWindowsMsiGenericSetupAlias({
  distDirectory,
  expectedVersion,
}: CreateWindowsMsiGenericSetupAliasOptions): Promise<Maybe<string>> {
  const fileNames = await fs.readdir(distDirectory);
  const versionedMsiFileNames = fileNames.filter(fileName => /-(x64|ia32|arm64)\.msi$/.test(fileName));
  const x64MsiFileNames = versionedMsiFileNames.filter(fileName =>
    getWindowsMsiSetupAliasNames({fileName}).genericFileName.isJust,
  );

  if (x64MsiFileNames.length > 1) {
    throw new Error(`Expected at most one x64 MSI in "${distDirectory}", found ${x64MsiFileNames.length}.`);
  }
  if (x64MsiFileNames.length === 0) {
    return Maybe.nothing<string>();
  }

  const [versionedMsiFileName] = x64MsiFileNames;
  const {genericFileName} = getWindowsMsiSetupAliasNames({expectedVersion, fileName: versionedMsiFileName});
  if (genericFileName.isNothing) {
    throw new Error(`Could not derive the generic MSI alias for "${versionedMsiFileName}".`);
  }

  const versionedMsiFilePath = path.join(distDirectory, versionedMsiFileName);
  const genericMsiFilePath = path.join(distDirectory, genericFileName.value);

  try {
    await fs.copy(versionedMsiFilePath, genericMsiFilePath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not create MSI alias "${genericFileName.value}" from "${versionedMsiFileName}": ${errorMessage}`,
    );
  }

  return Maybe.just(genericMsiFilePath);
}

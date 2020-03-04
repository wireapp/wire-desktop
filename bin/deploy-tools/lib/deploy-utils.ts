/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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
 */

import fs from 'fs-extra';
import globby from 'globby';
import isCi from 'is-ci';
import JSZip from 'jszip';
import logdown from 'logdown';
import path from 'path';

export interface FindOptions {
  cwd?: string;
  safeGuard?: boolean;
}

export interface FindResult {
  fileName: string;
  /** Includes directory AND file name */
  filePath: string;
}

export enum FileExtension {
  APPIMAGE = '.AppImage',
  ASC = '.asc',
  DEB = '.deb',
  EXE = '.exe',
  PKG = '.pkg',
  SIG = '.sig',
}

export const TWO_HUNDRED_MB_IN_BYTES = 209715200;

export async function find(fileGlob: string, options: {cwd?: string; safeGuard: false}): Promise<FindResult | null>;
export async function find(fileGlob: string, options: {cwd?: string; safeGuard?: boolean}): Promise<FindResult>;
export async function find(fileGlob: string, options?: FindOptions): Promise<FindResult | null> {
  const findOptions: Required<FindOptions> = {
    cwd: '.',
    safeGuard: true,
    ...options,
  };
  const matches = await globby(`**/${fileGlob}`, {cwd: findOptions.cwd, followSymbolicLinks: false, onlyFiles: true});

  if (matches.length > 0) {
    const file = path.resolve(matches[0]);
    return {fileName: path.basename(file), filePath: file};
  }

  if (findOptions.safeGuard) {
    throw new Error(`Could not find "${fileGlob}".`);
  }

  return null;
}

export function logDry(functionName: string, ...options: any[]): void {
  const logger = logdown('@wireapp/deploy-tools/DryLogger', {
    logger: console,
    markdown: false,
  });
  logger.state.isEnabled = !isCi;
  logger.info(`${functionName}:`, options);
}

export function zip(originalFile: string, zipFile: string): Promise<string> {
  const resolvedOriginal = path.resolve(originalFile);
  const resolvedZip = path.resolve(zipFile);

  const jszipOptions: JSZip.JSZipGeneratorOptions<'nodebuffer'> = {
    compressionOptions: {level: 9},
    streamFiles: true,
  };

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(resolvedOriginal).on('error', reject);
    const writeStream = fs
      .createWriteStream(resolvedZip)
      .on('error', reject)
      .on('finish', () => resolve(resolvedZip));
    const jszip = new JSZip().file(path.basename(resolvedOriginal), readStream);

    jszip
      .generateNodeStream(jszipOptions)
      .pipe(writeStream)
      .on('error', reject);
  });
}

/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import {Maybe, Result} from 'true-myth';

import * as assert from 'assert';

import {createLogArchiveDownloadAction, suggestFileName} from './download';

describe('download', () => {
  it('returns saved only after the selected archive is written', async () => {
    const steps: string[] = [];
    const downloadArchive = createLogArchiveDownloadAction({
      async chooseDestinationPath() {
        steps.push('choose');

        return Result.ok('logs.zip');
      },
      async writeArchive(destinationPath) {
        steps.push(`write:${destinationPath}`);
      },
    });

    const actualOutcome = await downloadArchive();

    assert.strictEqual(actualOutcome, 'saved');
    assert.deepStrictEqual(steps, ['choose', 'write:logs.zip']);
  });

  it('returns the save dialog cancellation outcome without writing an archive', async () => {
    let writeCount = 0;
    const downloadArchive = createLogArchiveDownloadAction({
      async chooseDestinationPath() {
        return Result.err('cancelled');
      },
      async writeArchive() {
        writeCount += 1;
      },
    });

    const actualOutcome = await downloadArchive();

    assert.strictEqual(actualOutcome, 'cancelled');
    assert.strictEqual(writeCount, 0);
  });

  it('returns a failure when the archive write fails', async () => {
    const downloadArchive = createLogArchiveDownloadAction({
      async chooseDestinationPath() {
        return Result.ok('logs.zip');
      },
      async writeArchive() {
        throw new Error('Archive write failed');
      },
    });

    const actualOutcome = await downloadArchive();

    assert.strictEqual(actualOutcome, 'failed');
  });

  it('allows a retry after the destination chooser throws synchronously', async () => {
    let chooseCount = 0;
    let writeCount = 0;
    const downloadArchive = createLogArchiveDownloadAction({
      chooseDestinationPath() {
        chooseCount += 1;
        if (chooseCount === 1) {
          throw new Error('Save dialog could not open');
        }

        return Promise.resolve(Result.ok('logs.zip'));
      },
      async writeArchive() {
        writeCount += 1;
      },
    });

    const firstDownload = downloadArchive();
    assert.strictEqual(chooseCount, 0);
    assert.strictEqual(await firstDownload, 'failed');
    assert.strictEqual(chooseCount, 1);

    const secondDownload = downloadArchive();

    assert.strictEqual(await secondDownload, 'saved');
    assert.strictEqual(chooseCount, 2);
    assert.strictEqual(writeCount, 1);
  });

  it('shares one in-progress export between the menu and WebView callers', async () => {
    const writeCompletion = Promise.withResolvers<void>();
    let chooseCount = 0;
    let writeCount = 0;
    const downloadArchive = createLogArchiveDownloadAction({
      async chooseDestinationPath() {
        chooseCount += 1;

        return Result.ok('logs.zip');
      },
      async writeArchive() {
        writeCount += 1;
        await writeCompletion.promise;
      },
    });

    const firstDownload = downloadArchive();
    const secondDownload = downloadArchive();
    assert.strictEqual(firstDownload, secondDownload);
    writeCompletion.resolve();

    const actualOutcomes = await Promise.all([firstDownload, secondDownload]);

    assert.deepStrictEqual(actualOutcomes, ['saved', 'saved']);
    assert.strictEqual(chooseCount, 1);
    assert.strictEqual(writeCount, 1);
  });

  it('keeps a new request coalesced until the previous outer promise clears its lock', async () => {
    const firstWriteStarted = Promise.withResolvers<void>();
    const firstWriteCompletion = Promise.withResolvers<void>();
    let chooseCount = 0;
    let writeCount = 0;
    const downloadArchive = createLogArchiveDownloadAction({
      chooseDestinationPath() {
        chooseCount += 1;

        return Promise.resolve(Result.ok(`logs-${chooseCount}.zip`));
      },
      writeArchive(destinationPath): Promise<void> {
        writeCount += 1;
        if (destinationPath === 'logs-1.zip') {
          firstWriteStarted.resolve();

          return firstWriteCompletion.promise;
        }

        return Promise.resolve();
      },
    });

    async function requestDownloadAfterFirstWriteCompletes(): Promise<'saved' | 'cancelled' | 'failed'> {
      await firstWriteCompletion.promise;

      return downloadArchive();
    }

    const firstDownload = downloadArchive();
    await firstWriteStarted.promise;
    const overlappingDownload = requestDownloadAfterFirstWriteCompletes();
    firstWriteCompletion.resolve();

    const [firstOutcome, overlappingOutcome] = await Promise.all([firstDownload, overlappingDownload]);
    const nextOutcome = await downloadArchive();

    assert.deepStrictEqual([firstOutcome, overlappingOutcome, nextOutcome], ['saved', 'saved', 'saved']);
    assert.strictEqual(chooseCount, 2);
    assert.strictEqual(writeCount, 2);
  });

  it('converts colons to dashes because colons cannot be used in filenames on Windows', async () => {
    // May 4th 2020, 13:42:00
    const actual = suggestFileName(Maybe.just('1588599720000'));
    const expected = `Wire 2020-05-04 at 13-42-00`;

    assert.equal(actual, expected);
  });
});

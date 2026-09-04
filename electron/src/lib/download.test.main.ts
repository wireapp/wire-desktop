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

import {Maybe} from 'true-myth';

import * as assert from 'assert';

import {downloadLogArchive, suggestFileName} from './download';

describe('download', () => {
  it('converts colons to dashes because colons cannot be used in filenames on Windows', async () => {
    // May 4th 2020, 13:42:00
    const actual = suggestFileName(Maybe.just('1588599720000'));
    const expected = `Wire 2020-05-04 at 13-42-00`;

    assert.equal(actual, expected);
  });

  it('does no export work when the save dialog is cancelled', async () => {
    let exportWorkCount = 0;

    await downloadLogArchive({
      async chooseDestinationPath() {
        return Maybe.nothing<string>();
      },
      async writeArchive() {
        exportWorkCount += 1;
      },
    });

    assert.strictEqual(exportWorkCount, 0);
  });

  it('writes the archive only after a destination has been selected', async () => {
    const events: string[] = [];

    await downloadLogArchive({
      async chooseDestinationPath() {
        events.push('choose-destination');

        return Maybe.just('logs.zip');
      },
      async writeArchive() {
        events.push('write-archive');
      },
    });

    assert.deepStrictEqual(events, ['choose-destination', 'write-archive']);
  });
});

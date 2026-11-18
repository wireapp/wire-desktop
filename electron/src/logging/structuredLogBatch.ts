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

import is from '@sindresorhus/is';
import {Maybe, ResultNS, Task} from 'true-myth';

import {Buffer} from 'buffer';

export const structuredLogLimits = {
  maximumRecordBytes: 256 * 1024,
  maximumBatchBytes: 256 * 1024,
  maximumBatchRecords: 1024,
  maximumPendingBatches: 8,
} as const;

export type StructuredLogWriteResult = 'written' | 'rejected' | 'busy' | 'failed';

export type DesktopApplicationLogs = {
  readonly version: 1;
  /**
   * Submit sanitized Pino JSON strings as emitted by Webapp's encodeLogOutput.
   * Records exclude raw CR and LF characters. Escaped newlines in JSON values are allowed.
   * Desktop preserves each string and adds an LF whose byte counts toward both UTF-8 limits.
   */
  readonly write: (records: readonly string[]) => Promise<StructuredLogWriteResult>;
};

const parseLogRecord = ResultNS.safe((line: string): unknown => {
  return JSON.parse(line);
});

export function readBoundedLogBatch(batch: unknown): Maybe<readonly string[]> {
  if (!is.nonEmptyArray(batch) || batch.length > structuredLogLimits.maximumBatchRecords) {
    return Maybe.nothing();
  }

  const recordCount = batch.length;
  const records: string[] = [];
  let batchBytes = 0;
  for (let recordIndex = 0; recordIndex < recordCount; recordIndex += 1) {
    const record: unknown = batch[recordIndex];
    if (!is.string(record) || record.length >= structuredLogLimits.maximumRecordBytes) {
      return Maybe.nothing();
    }

    const recordBytes = Buffer.byteLength(record, 'utf8') + 1;
    batchBytes += recordBytes;
    if (recordBytes > structuredLogLimits.maximumRecordBytes || batchBytes > structuredLogLimits.maximumBatchBytes) {
      return Maybe.nothing();
    }

    records.push(record);
  }

  return Maybe.just(records);
}

export function isStructuredLogRecord(line: string): boolean {
  if (line.includes('\n') || line.includes('\r')) {
    return false;
  }

  const parsed = parseLogRecord(line);
  if (parsed.isErr || !is.plainObject(parsed.value)) {
    return false;
  }

  const {level, time, component, msg} = parsed.value;
  return (
    (level === 20 || level === 30 || level === 40 || level === 50) &&
    is.safeInteger(time) &&
    time >= 0 &&
    is.string(component) &&
    (is.undefined(msg) || is.string(msg))
  );
}

export function createDesktopApplicationLogs(
  invoke: (records: readonly string[]) => Promise<StructuredLogWriteResult>,
): DesktopApplicationLogs {
  let writeInProgress = false;

  async function invokeBoundedBatch(records: unknown): Promise<StructuredLogWriteResult> {
    const batch = readBoundedLogBatch(records);
    if (batch.isNothing) {
      return 'rejected';
    }

    return invoke(batch.value);
  }

  async function write(records: readonly string[]): Promise<StructuredLogWriteResult> {
    if (writeInProgress) {
      return 'busy';
    }

    writeInProgress = true;
    try {
      const result = await Task.tryOr(invokeBoundedBatch(records), 'failed');
      return result.unwrapOr('failed');
    } finally {
      writeInProgress = false;
    }
  }

  return {version: 1, write};
}

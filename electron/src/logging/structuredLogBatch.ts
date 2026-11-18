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
  readonly write: (records: readonly string[]) => Promise<StructuredLogWriteResult>;
};

export function readBoundedLogBatch(batch: unknown): readonly string[] | undefined {
  if (Array.isArray(batch) === false || batch.length === 0 || batch.length > structuredLogLimits.maximumBatchRecords) {
    return undefined;
  }

  const recordCount = batch.length;
  const records: string[] = [];
  let batchBytes = 0;
  for (let recordIndex = 0; recordIndex < recordCount; recordIndex += 1) {
    const record: unknown = batch[recordIndex];
    if (typeof record !== 'string' || record.length > structuredLogLimits.maximumRecordBytes) {
      return undefined;
    }

    const recordBytes = Buffer.byteLength(record, 'utf8');
    batchBytes += recordBytes;
    if (recordBytes > structuredLogLimits.maximumRecordBytes || batchBytes > structuredLogLimits.maximumBatchBytes) {
      return undefined;
    }

    records.push(record);
  }

  return records;
}

export function isStructuredLogRecord(line: string): boolean {
  if (line.indexOf('\n') !== line.length - 1 || line.includes('\r')) {
    return false;
  }

  try {
    const record: unknown = JSON.parse(line);
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      return false;
    }

    const {level, time, component, msg} = record as Record<string, unknown>;
    return (
      (level === 20 || level === 30 || level === 40 || level === 50) &&
      typeof time === 'number' &&
      Number.isSafeInteger(time) &&
      time >= 0 &&
      typeof component === 'string' &&
      (msg === undefined || typeof msg === 'string')
    );
  } catch {
    return false;
  }
}

export function createDesktopApplicationLogs(
  invoke: (records: readonly string[]) => Promise<StructuredLogWriteResult>,
): DesktopApplicationLogs {
  let writeInProgress = false;

  async function write(records: readonly string[]): Promise<StructuredLogWriteResult> {
    if (writeInProgress) {
      return 'busy';
    }

    writeInProgress = true;
    try {
      const batch = readBoundedLogBatch(records);
      return batch === undefined ? 'rejected' : await invoke(batch);
    } catch {
      return 'failed';
    } finally {
      writeInProgress = false;
    }
  }

  return {version: 1, write};
}

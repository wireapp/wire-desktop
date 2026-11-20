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

import {Maybe} from 'true-myth';

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

export function readBoundedLogBatch(batch: unknown): Maybe<readonly string[]> {
  if (!Array.isArray(batch) || batch.length === 0 || batch.length > structuredLogLimits.maximumBatchRecords) {
    return Maybe.nothing();
  }

  const recordCount = batch.length;
  const records: string[] = [];
  let batchBytes = 0;
  for (let recordIndex = 0; recordIndex < recordCount; recordIndex += 1) {
    const record: unknown = batch[recordIndex];
    if (typeof record !== 'string' || record.length >= structuredLogLimits.maximumRecordBytes) {
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return false;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return false;
  }

  const {level, time, component, msg} = parsed as Record<string, unknown>;
  return (
    (level === 20 || level === 30 || level === 40 || level === 50) &&
    typeof time === 'number' &&
    Number.isSafeInteger(time) &&
    time >= 0 &&
    typeof component === 'string' &&
    (msg === undefined || typeof msg === 'string')
  );
}

export function isPinoConsoleRecord(message: string): boolean {
  // The browser encoder writes this compact header in order. Keep unrelated JSON and
  // unstructured console diagnostics, even when Electron reports a matching severity.
  const pinoHeader = /^\{"time":\d+,"level":(?:20|30|40|50),"component":"@wireapp\/[a-z0-9_./-]+"/i;

  return (
    message.length < structuredLogLimits.maximumRecordBytes &&
    pinoHeader.test(message) &&
    Buffer.byteLength(message, 'utf8') < structuredLogLimits.maximumRecordBytes &&
    isStructuredLogRecord(message)
  );
}

export function createDesktopApplicationLogs(
  invoke: (records: readonly string[]) => Promise<StructuredLogWriteResult>,
): DesktopApplicationLogs {
  let writeInProgress = false;

  return {
    version: 1,
    async write(records): Promise<StructuredLogWriteResult> {
      if (writeInProgress) {
        return 'busy';
      }

      writeInProgress = true;
      try {
        const batch = readBoundedLogBatch(records);
        if (batch.isNothing) {
          return 'rejected';
        }

        return await invoke(batch.value);
      } catch {
        return 'failed';
      } finally {
        writeInProgress = false;
      }
    },
  };
}

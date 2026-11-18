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

import * as assert from 'assert';
import * as path from 'path';

import {getWebViewApplicationLogPath} from './logPaths';
import {createDesktopApplicationLogs, structuredLogLimits} from './structuredLogBatch';
import {createStructuredWebappLogger, StructuredWebappLogger} from './structuredWebappLogger';
import {createWebViewConsoleLogger} from './webViewConsoleLogger';

import {NavigationOrigins} from '../runtime/OriginValidator';

const allowedOrigin = 'https://app.example.com';
const wrapper = {};
const accountId = '11111111-1111-4111-8111-111111111111';
const otherAccountId = '22222222-2222-4222-8222-222222222222';
const record =
  '{"level":30,"time":42,"component":"@wireapp/core/Account","msg":"Connected\\nRetry complete","error":{"detail":"\\u0025"}}';
const recordWithoutMessage = '{"level":40,"time":42,"component":"@wireapp/core/Account","count":2}';

type CreateGuestOptions = {
  id?: number;
  url?: string;
  hostWebContents?: object;
};

type TestGuest = Parameters<StructuredWebappLogger['receive']>[0];
type TestDependencies = Parameters<typeof createStructuredWebappLogger>[0];
type TestWebViewContext = NavigationOrigins & {
  accountId: string;
  contents: TestGuest['sender'];
  loggingRevoked: boolean;
};
type RecordedBatch = Parameters<TestDependencies['writeBatch']>[0];
type TestReceiver = {
  guest: TestGuest;
  receiver: StructuredWebappLogger;
  writes: RecordedBatch[];
  context: TestWebViewContext;
};

function createGuest({id = 1, url = allowedOrigin, hostWebContents = wrapper}: CreateGuestOptions = {}): TestGuest {
  const mainFrame = {url};
  const sender = {
    id,
    mainFrame,
    hostWebContents,
    isDestroyed() {
      return false;
    },
  };
  return {sender, senderFrame: mainFrame};
}

function createContext(contents: TestGuest['sender'], identifier = accountId): TestWebViewContext {
  return {
    accountId: identifier,
    contents,
    pendingOrigin: Maybe.nothing<string>(),
    loggingRevoked: false,
    trustedOrigin: Maybe.just(allowedOrigin),
  };
}

function createReceiver(overrides: Partial<TestDependencies> = {}): TestReceiver {
  const guest = createGuest();
  const context = createContext(guest.sender);
  const writes: RecordedBatch[] = [];
  const receiver = createStructuredWebappLogger({
    getWebViewContext() {
      return Maybe.just(context);
    },
    getWrapperWebContents() {
      return Maybe.just(wrapper);
    },
    getCurrentDate() {
      return new Date('2026-07-10T23:59:59.999Z');
    },
    async writeBatch(batch) {
      writes.push(batch);
    },
    ...overrides,
  });

  return {guest, receiver, writes, context};
}

describe('structured Webapp logging', () => {
  it('accepts a batch without rewriting Webapp JSON', async () => {
    const {guest, receiver, writes} = createReceiver();
    const records = [record, recordWithoutMessage];

    assert.strictEqual(await receiver.receive(guest, records), 'written');
    assert.deepStrictEqual(writes, [{accountId, date: new Date('2026-07-10T23:59:59.999Z'), records}]);
  });

  it('rejects the entire batch when a record is unsupported or malformed', async () => {
    const {guest, receiver, writes} = createReceiver();
    const invalidRecords = [
      '',
      'null',
      '[]',
      '{}',
      '{"level":60,"time":42,"component":"Account"}',
      '{"level":30,"time":"42","component":"Account"}',
      '{"level":30,"time":-1,"component":"Account"}',
      '{"level":30,"time":42,"component":false}',
      '{"level":30,"time":42,"component":"Account","msg":42}',
      '{"level":30,\n"time":42,"component":"Account"}',
      '{"level":30,\r"time":42,"component":"Account"}',
      `${record}\n`,
      `${record}\r\n`,
      record + record,
      '{"level":30,"time":42,"component":"Account"',
      null,
    ];

    for (const invalidRecord of invalidRecords) {
      assert.strictEqual(await receiver.receive(guest, [record, invalidRecord]), 'rejected');
    }
    assert.strictEqual(await receiver.receive(guest, []), 'rejected');
    assert.strictEqual(await receiver.receive(guest, {accountId: otherAccountId, records: [record]}), 'rejected');
    assert.deepStrictEqual(writes, []);
  });

  it('counts stored LF delimiters in UTF-8 record and batch limits', async () => {
    const {guest, receiver, writes} = createReceiver();
    const multibyteRecord = record.replace('Connected', 'éééé');
    const multibyteRecordBytes = Buffer.byteLength(multibyteRecord, 'utf8');
    const largestRecord =
      multibyteRecord + ' '.repeat(structuredLogLimits.maximumRecordBytes - multibyteRecordBytes - 1);
    const lastBatchRecord =
      recordWithoutMessage +
      ' '.repeat(
        structuredLogLimits.maximumBatchBytes -
          multibyteRecordBytes -
          Buffer.byteLength(recordWithoutMessage, 'utf8') -
          2,
      );

    assert.strictEqual(await receiver.receive(guest, [`${largestRecord} `]), 'rejected');
    assert.strictEqual(await receiver.receive(guest, [multibyteRecord, `${lastBatchRecord} `]), 'rejected');
    assert.deepStrictEqual(writes, []);
    assert.strictEqual(await receiver.receive(guest, [largestRecord]), 'written');
    assert.strictEqual(await receiver.receive(guest, [multibyteRecord, lastBatchRecord]), 'written');
  });

  it('bounds the number of records in a batch', async () => {
    const {guest, receiver, writes} = createReceiver();
    assert.strictEqual(
      await receiver.receive(
        guest,
        Array.from({length: structuredLogLimits.maximumBatchRecords + 1}, () => {
          return record;
        }),
      ),
      'rejected',
    );
    assert.deepStrictEqual(writes, []);
  });

  it('requires the registered guest, wrapper, top frame, and authorized origin', async () => {
    const untrusted = createGuest({id: 2, url: 'https://untrusted.example.com'});
    const foreignHost = createGuest({id: 3, hostWebContents: {}});
    const guest = createGuest({id: 4});
    const contexts = new Map(
      [untrusted, foreignHost, guest].map(({sender}) => {
        return [sender.id, createContext(sender)];
      }),
    );
    const {receiver, writes} = createReceiver({
      getWebViewContext(senderId) {
        return Maybe.of(contexts.get(senderId));
      },
    });

    for (const unauthorized of [
      untrusted,
      foreignHost,
      createGuest(),
      createGuest({id: guest.sender.id}),
      {sender: guest.sender, senderFrame: null},
      {sender: guest.sender, senderFrame: {url: allowedOrigin}},
    ]) {
      assert.strictEqual(await receiver.receive(unauthorized, [record]), 'rejected');
    }

    assert.deepStrictEqual(writes, []);
    assert.strictEqual(await receiver.receive(guest, [record]), 'written');
  });

  it('groups batches by receipt day and uses account identity from the guest context', async () => {
    const firstGuest = createGuest();
    const secondGuest = createGuest({id: 2});
    const contexts = new Map([
      [firstGuest.sender.id, createContext(firstGuest.sender)],
      [secondGuest.sender.id, createContext(secondGuest.sender, otherAccountId)],
    ]);
    let receivedAt = new Date('2026-07-11T01:59:59.999+02:00');
    const outputPaths: string[] = [];
    const {receiver} = createReceiver({
      getWebViewContext(senderId) {
        return Maybe.of(contexts.get(senderId));
      },
      getCurrentDate() {
        return receivedAt;
      },
      async writeBatch({accountId: authorizedAccountId, date}) {
        outputPaths.push(getWebViewApplicationLogPath({accountId: authorizedAccountId, date, logDirectory: 'logs'}));
      },
    });
    const recordWithForeignAccount = record.replace('"msg"', `"accountId":"${otherAccountId}","msg"`);

    assert.strictEqual(await receiver.receive(firstGuest, [recordWithForeignAccount]), 'written');
    assert.strictEqual(await receiver.receive(secondGuest, [record]), 'written');
    receivedAt = new Date('2026-07-11T02:00:00.000+02:00');
    assert.strictEqual(await receiver.receive(firstGuest, [record]), 'written');

    assert.deepStrictEqual(outputPaths, [
      path.join('logs', '2026-07-10', 'accounts', accountId, 'application.jsonl'),
      path.join('logs', '2026-07-10', 'accounts', otherAccountId, 'application.jsonl'),
      path.join('logs', '2026-07-11', 'accounts', accountId, 'application.jsonl'),
    ]);
  });

  it('bounds pending work, returns write failures, and accepts further batches', async () => {
    const guests = Array.from({length: structuredLogLimits.maximumPendingBatches + 1}, (_, index) => {
      return createGuest({id: index + 1});
    });
    const contexts = new Map(
      guests.map(({sender}) => {
        return [sender.id, createContext(sender)];
      }),
    );
    const blockedWrites = Promise.withResolvers<void>();
    let completion = blockedWrites.promise;
    const {receiver} = createReceiver({
      getWebViewContext(senderId) {
        return Maybe.of(contexts.get(senderId));
      },
      writeBatch() {
        return completion;
      },
    });
    const pending = guests.slice(0, -1).map(guest => {
      return receiver.receive(guest, [record]);
    });
    const lastGuest = guests[guests.length - 1];

    assert.strictEqual(await receiver.receive(guests[0], [record]), 'busy');
    assert.strictEqual(await receiver.receive(lastGuest, [record]), 'busy');
    blockedWrites.reject(new Error('disk full'));
    const results = await Promise.all(pending);
    assert.deepStrictEqual(
      results,
      pending.map(() => {
        return 'failed';
      }),
    );

    completion = Promise.resolve();
    assert.strictEqual(await receiver.receive(lastGuest, [record]), 'written');
  });

  it('drains accepted writes before account deletion and rejects writes during deletion', async () => {
    const activeWrite = Promise.withResolvers<void>();
    const {guest, receiver, context} = createReceiver({
      writeBatch() {
        return activeWrite.promise;
      },
    });
    const pendingWrite = receiver.receive(guest, [record]);
    assert.deepStrictEqual(receiver.getConsoleLogAccountId(guest.sender), Maybe.just(accountId));
    let deletionStarted = false;
    const deletion = receiver.runAccountDeletion(accountId, async () => {
      deletionStarted = true;
    });

    assert.strictEqual(await receiver.receive(guest, [record]), 'rejected');
    assert.strictEqual(receiver.getConsoleLogAccountId(guest.sender).isNothing, true);
    assert.strictEqual(deletionStarted, false);
    activeWrite.resolve();
    assert.strictEqual(await pendingWrite, 'written');
    await deletion;
    assert.strictEqual(deletionStarted, true);

    context.loggingRevoked = true;
    assert.strictEqual(await receiver.receive(guest, [record]), 'rejected');
    assert.strictEqual(receiver.getConsoleLogAccountId(guest.sender).isNothing, true);
  });

  it('drops excess preload calls and recovers from an IPC rejection', async () => {
    const firstWrite = Promise.withResolvers<'written'>();
    const batches: (readonly string[])[] = [];
    const capability = createDesktopApplicationLogs(async records => {
      batches.push(records);
      return batches.length === 1 ? firstWrite.promise : 'written';
    });

    assert.strictEqual(capability.version, 1);
    assert.strictEqual(await capability.write([]), 'rejected');
    const result = capability.write([record]);
    assert.strictEqual(await capability.write([record]), 'busy');

    firstWrite.reject(new Error('IPC unavailable'));
    assert.strictEqual(await result, 'failed');
    assert.strictEqual(await capability.write([record]), 'written');
    assert.deepStrictEqual(batches, [[record], [record]]);
  });

  it('returns failed for synchronous write or IPC errors and accepts subsequent batches', async () => {
    let shouldThrow = true;
    const {guest, receiver} = createReceiver({
      writeBatch() {
        if (shouldThrow) {
          throw new Error('write unavailable');
        }

        return Promise.resolve();
      },
    });
    const capability = createDesktopApplicationLogs(records => {
      if (shouldThrow) {
        throw new Error('IPC unavailable');
      }

      return receiver.receive(guest, records);
    });

    assert.strictEqual(await receiver.receive(guest, [record]), 'failed');
    assert.strictEqual(await capability.write([record]), 'failed');

    shouldThrow = false;
    assert.strictEqual(await capability.write([record]), 'written');
  });

  it('still captures and sanitizes console messages alongside structured records', async () => {
    const {guest, receiver, writes} = createReceiver();
    const consoleWrites: string[] = [];
    const logConsoleMessage = createWebViewConsoleLogger({
      getAccountId() {
        return receiver.getConsoleLogAccountId(guest.sender);
      },
      getLogFilePath() {
        return 'console.log';
      },
      async writeLogMessage({logFilePath, message}) {
        consoleWrites.push(`${logFilePath}: ${message}`);
      },
      reportWriteFailure: assert.fail,
    });

    await logConsoleMessage({message: '%clegacy message%c access_token=private'});
    assert.strictEqual(await receiver.receive(guest, [record]), 'written');
    await logConsoleMessage({message: 'still captured'});

    assert.deepStrictEqual(consoleWrites, ['console.log: legacy message ', 'console.log: still captured']);
    assert.deepStrictEqual(writes[0].records, [record]);
  });
});

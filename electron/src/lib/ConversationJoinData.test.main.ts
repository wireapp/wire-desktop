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

import * as assert from 'assert';

import {meetingJoinData, withoutMeetingPassword} from './ConversationJoinData';

import {isConversationJoinData} from '../../renderer/src/types/guards';

describe('native meeting join data', () => {
  it('removes the supplied password from persisted link data without changing queued delivery', () => {
    const data = {kind: 'meeting' as const, key: 'key', code: 'code', domain: 'example.com', password: 'secret'};
    assert.deepStrictEqual(withoutMeetingPassword(data), {
      kind: 'meeting',
      key: 'key',
      code: 'code',
      domain: 'example.com',
    });
    assert.strictEqual(data.password, 'secret');
  });
  it('preserves the meeting discriminator and credentials across the host data guard', () => {
    const data = meetingJoinData(
      new URL('wire://meeting-join/?domain=example.com&key=key%26value&code=code%23fragment&password=secret'),
    );
    assert.deepStrictEqual(data, {
      kind: 'meeting',
      domain: 'example.com',
      key: 'key&value',
      code: 'code#fragment',
      password: 'secret',
    });
    assert.strictEqual(isConversationJoinData(data), true);
  });
  for (const missing of ['domain', 'key', 'code']) {
    it(`rejects meeting links missing ${missing}`, () => {
      const url = new URL('wire://meeting-join/?domain=example.com&key=key&code=code');
      url.searchParams.delete(missing);
      assert.strictEqual(meetingJoinData(url), undefined);
    });
  }
  it('accepts legacy and explicit conversation kinds while validating each variant', () => {
    assert.strictEqual(isConversationJoinData({key: 'key', code: 'code'}), true);
    assert.strictEqual(isConversationJoinData({key: 'key', code: 'code', domain: null}), true);
    assert.strictEqual(isConversationJoinData({key: 'key', code: 'code', password: 'secret'}), false);
    assert.strictEqual(isConversationJoinData({kind: 'conversation', key: 'key', code: 'code'}), true);
    assert.strictEqual(isConversationJoinData({kind: 'conversation', key: 'key', code: 'code', domain: null}), true);
    assert.strictEqual(isConversationJoinData({kind: 'conversation', key: 'key', code: 'code', domain: 42}), false);
    assert.strictEqual(
      isConversationJoinData({kind: 'conversation', key: 'key', code: 'code', password: 'secret'}),
      false,
    );
    assert.strictEqual(isConversationJoinData({key: 'key', code: 'code', kind: 'meeting'}), false);
    assert.strictEqual(isConversationJoinData({key: 'key', code: 'code', kind: 'unknown'}), false);
  });
});

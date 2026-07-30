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

import {EVENT_TYPE} from './eventType';
import {forwardWrapperReloadRequest} from './forwardWrapperReloadRequest';

describe('forwardWrapperReloadRequest', () => {
  it('forwards a wrapper reload request', () => {
    const forwardedEventTypes: string[] = [];

    function send(eventType: string): void {
      forwardedEventTypes.push(eventType);
    }

    forwardWrapperReloadRequest({send});

    assert.deepStrictEqual(forwardedEventTypes, [EVENT_TYPE.WRAPPER.RELOAD]);
  });
});

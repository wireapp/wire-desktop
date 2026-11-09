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

import type {ConversationJoinData} from '../../renderer/src/types/account';

export function meetingJoinData(route: URL): ConversationJoinData | undefined {
  const code = route.searchParams.get('code');
  const key = route.searchParams.get('key');
  const domain = route.searchParams.get('domain');
  if (
    code === null ||
    code.length === 0 ||
    key === null ||
    key.length === 0 ||
    domain === null ||
    domain.length === 0
  ) {
    return undefined;
  }
  return {kind: 'meeting', code, key, domain};
}

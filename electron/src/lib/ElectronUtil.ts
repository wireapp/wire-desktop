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

import type {WebContents} from 'electron';

export async function executeJavaScriptWithoutResult(snippet: string, target: WebContents) {
  // This removes all trailing `;` and adds `;0` at the end of the snippet to
  // ensure the resulting value of `executeJavaScript()` is not used.
  // See https://github.com/electron/electron/issues/23722.

  snippet = `${snippet.replace(/;+$/, '')};0`;
  await target.executeJavaScript(snippet);
}

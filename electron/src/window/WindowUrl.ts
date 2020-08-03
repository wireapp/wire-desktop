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

export class WindowUrl {
  static createWebAppUrl(localRendererUrl: string, customBackendUrl: string): string {
    const localFileParams = new URL(localRendererUrl).searchParams;
    const customBackendUrlParsed = new URL(customBackendUrl);
    const envUrl = decodeURIComponent(localFileParams.get('env')!);
    const envUrlParams = new URL(envUrl).searchParams;
    envUrlParams.forEach((value, key) => {
      customBackendUrlParsed.searchParams.set(key, value);
    });
    return customBackendUrlParsed.href;
  }
}

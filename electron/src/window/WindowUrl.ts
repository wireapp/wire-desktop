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
  static parseParams(url: string): URLSearchParams {
    const urlObject = new URL(url);
    return urlObject.searchParams;
  }

  static getQueryString(params: URLSearchParams): string {
    const _params: string[] = [];
    params.forEach((value, key) => {
      _params.push(`${key}=${value}`);
    });
    return `?${_params.join('&')}`;
  }

  static replaceQueryParams(url: string, params: URLSearchParams): string {
    const fullHost = url.split('?')[0];
    const unescapedQueryParams = WindowUrl.getQueryString(params);
    return encodeURIComponent(`${fullHost}${unescapedQueryParams}`);
  }

  static createWebappUrl(localRendererUrl: string, customBackendUrl: string): string {
    const localFileParams = WindowUrl.parseParams(localRendererUrl);
    const envUrlParams = WindowUrl.parseParams(localFileParams.get('env') as string);
    const customBackendUrlParams = WindowUrl.parseParams(customBackendUrl);
    const mergedParams = envUrlParams;
    customBackendUrlParams.forEach((value, key) => {
      mergedParams.set(key, value);
    });
    const newEnvUrl = WindowUrl.replaceQueryParams(customBackendUrl, mergedParams);
    return newEnvUrl;
  }
}

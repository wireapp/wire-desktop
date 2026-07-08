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

import {wrapperLocale} from './locale';

const staticResourcePathPrefixes = [
  '/min',
  '/assets',
  '/audio',
  '/ext',
  '/font',
  '/image',
  '/proto',
  '/style',
  '/worker',
];

const staticResourcePathExtensions = [
  '.js',
  '.css',
  '.map',
  '.wasm',
  '.mjs',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.mp3',
  '.ogg',
];

export function isAllowedWebAppNavigationUrl(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();
  const hasStaticResourcePrefix = staticResourcePathPrefixes.some(
    pathPrefix => pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`),
  );

  if (hasStaticResourcePrefix) {
    return false;
  }

  if (pathname === '/sw.js') {
    return false;
  }

  const hasStaticResourceExtension = staticResourcePathExtensions.some(extension => pathname.endsWith(extension));

  if (hasStaticResourceExtension) {
    return false;
  }

  return true;
}

export class WindowUrl {
  static createWebAppUrl(localRendererUrl: URL | string, customBackendUrl: string): string {
    const localFileParams = new URL(localRendererUrl).searchParams;
    const customBackendUrlParsed = new URL(customBackendUrl);

    if (!isAllowedWebAppNavigationUrl(customBackendUrlParsed)) {
      throw new Error(
        `Invalid WebApp URL: static resource URLs cannot be used as WebApp navigation URLs (${customBackendUrlParsed.href})`,
      );
    }

    const envUrl = decodeURIComponent(localFileParams.get('env')!);
    const envUrlParams = new URL(envUrl).searchParams;

    // replace hl with current locale
    envUrlParams.forEach((value, key) => {
      customBackendUrlParsed.searchParams.set(key, value);
    });

    // set the current language
    envUrlParams.set('hl', wrapperLocale);

    return customBackendUrlParsed.href;
  }
}

/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import {i18nLanguageIdentifier} from '../../../src/locale';

interface WireDesktopGlobal {
  wireDesktop?: {
    locStrings?: Record<string, string>;
    locStringsDefault?: Record<string, string>;
    locale?: string;
  };
}

export const getText = (
  stringIdentifier: i18nLanguageIdentifier,
  paramReplacements?: Record<string, string>,
): string => {
  const wireDesktop = (globalThis as WireDesktopGlobal).wireDesktop;
  const locStrings = wireDesktop?.locStrings || {};
  const locStringsDefault = wireDesktop?.locStringsDefault || {};

  const locStringsMap = new Map(Object.entries(locStrings));
  const locStringsDefaultMap = new Map(Object.entries(locStringsDefault));

  let str: string =
    (locStringsMap.get(stringIdentifier) as string) ||
    (locStringsDefaultMap.get(stringIdentifier) as string) ||
    stringIdentifier;

  if (paramReplacements) {
    const replacementsMap = new Map(Object.entries(paramReplacements));
    for (const [replacement, value] of replacementsMap) {
      if (!/^[a-zA-Z0-9_-]+$/.test(replacement)) {
        continue;
      }
      if (typeof value !== 'string') {
        continue;
      }
      const placeholder = `{${replacement}}`;
      if (str.includes(placeholder)) {
        str = str.replaceAll(placeholder, value);
      }
    }
  }

  return str;
};

export const wrapperLocale = (): string => (globalThis as WireDesktopGlobal).wireDesktop?.locale || 'en';

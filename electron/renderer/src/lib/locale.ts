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

import {i18nLanguageIdentifier, SupportedI18nLanguage} from '../../../src/locale';

// Get locale info from electronAPI (contextBridge)
// Made lazy to avoid accessing window.electronAPI before preload script has executed
const getLocaleInfo = () => {
  if (window.electronAPI) {
    return {
      strings: window.electronAPI.locale.strings,
      stringsDefault: window.electronAPI.locale.stringsDefault,
      current: window.electronAPI.locale.current,
    };
  }
  // Fallback for development/testing or when electronAPI isn't available yet
  return {
    strings: {},
    stringsDefault: {},
    current: 'en' as SupportedI18nLanguage,
  };
};

// Cache locale info once it's available
let localeInfoCache: ReturnType<typeof getLocaleInfo> | null = null;

const getCachedLocaleInfo = () => {
  if (!localeInfoCache) {
    localeInfoCache = getLocaleInfo();
  }
  return localeInfoCache;
};

export const getText = (stringIdentifier: i18nLanguageIdentifier, paramReplacements?: Record<string, string>) => {
  const localeInfo = getCachedLocaleInfo();
  const strings = localeInfo.strings as Record<string, string>;
  const stringsDefault = localeInfo.stringsDefault as Record<string, string>;
  let str = strings[stringIdentifier] || stringsDefault[stringIdentifier] || stringIdentifier;

  const replacements = {...paramReplacements};
  for (const replacement of Object.keys(replacements)) {
    const regex = new RegExp(`{${replacement}}`, 'g');
    if (str.match(regex)) {
      str = str.replace(regex, replacements[replacement]);
    }
  }

  return str;
};

// wrapperLocale is used as a constant in WindowUrl.ts and Webview.tsx
// We'll initialize it lazily - it will be 'en' initially and may update when electronAPI becomes available
// For now, we'll use a getter function approach, but export it as a value for compatibility
let _wrapperLocale: SupportedI18nLanguage = 'en' as SupportedI18nLanguage;

// Try to initialize immediately, but don't fail if electronAPI isn't ready
try {
  const info = getLocaleInfo();
  _wrapperLocale = info.current;
} catch {
  // Ignore errors - will use 'en' as default
}

// Update locale when electronAPI becomes available (if it wasn't available initially)
if (typeof window !== 'undefined') {
  // Use a small delay to allow preload script to finish
  setTimeout(() => {
    try {
      const info = getLocaleInfo();
      if (info.current !== 'en' || window.electronAPI) {
        _wrapperLocale = info.current;
      }
    } catch {
      // Ignore errors
    }
  }, 100);
}

export const wrapperLocale: SupportedI18nLanguage = _wrapperLocale;

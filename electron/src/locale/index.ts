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

import * as Electron from 'electron';

import cs from './cs-CZ.json';
import da from './da-DK.json';
import de from './de-DE.json';
import el from './el-GR.json';
import en from './en-US.json';
import es from './es-ES.json';
import et from './et-EE.json';
import fi from './fi-FI.json';
import fr from './fr-FR.json';
import hr from './hr-HR.json';
import hu from './hu-HU.json';
import it from './it-IT.json';
import lt from './lt-LT.json';
import nl from './nl-NL.json';
import pl from './pl-PL.json';
import pt from './pt-BR.json';
import ro from './ro-RO.json';
import ru from './ru-RU.json';
import si from './si-LK.json';
import sk from './sk-SK.json';
import sl from './sl-SI.json';
import tr from './tr-TR.json';
import uk from './uk-UA.json';
import zh from './zh-CN.json';

import {config} from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import {getManagedSettingOverride, isSettingManaged} from '../settings/ManagedConfig';
import {SettingsType} from '../settings/SettingsType';

export type i18nLanguageIdentifier = keyof typeof en;
export type i18nStrings = Record<i18nLanguageIdentifier, string>;
export type SupportedI18nLanguage = keyof typeof SUPPORTED_LANGUAGES;
export type SupportedI18nLanguageObject = Record<SupportedI18nLanguage, i18nStrings>;

const app = Electron.app || require('@electron/remote').app;

const parseLocale = (locale: string): SupportedI18nLanguage => {
  const languageKeys = Object.keys(SUPPORTED_LANGUAGES) as SupportedI18nLanguage[];
  return languageKeys.find(languageKey => languageKey === locale) || languageKeys[0];
};

/**
 * Normalize managed locale (e.g. pt-BR, en-US) to a supported key (pt, en) so it matches
 * existing app behaviour. Empty/whitespace falls back to default via parseLocale('').
 * @param {string} raw - Managed locale string from MDM (e.g. "pt-BR", "en").
 * @returns {SupportedI18nLanguage} A supported language key for the app.
 */
const normalizeManagedLocale = (raw: string): SupportedI18nLanguage => {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return parseLocale('');
  }
  const keys = Object.keys(SUPPORTED_LANGUAGES) as SupportedI18nLanguage[];
  if (keys.includes(trimmed as SupportedI18nLanguage)) {
    return trimmed as SupportedI18nLanguage;
  }
  const primary = trimmed.split('-')[0]?.trim() || trimmed;
  return parseLocale(primary);
};

const getSystemLocale = (): SupportedI18nLanguage => parseLocale(app.getLocale().substring(0, 2));

export const LANGUAGES: SupportedI18nLanguageObject = {
  cs,
  da,
  de,
  el,
  en,
  es,
  et,
  fi,
  fr,
  hr,
  hu,
  it,
  lt,
  nl,
  pl,
  pt,
  ro,
  ru,
  si,
  sk,
  sl,
  tr,
  uk,
  zh,
};

export const supportedSpellCheckLanguages: Record<SupportedI18nLanguage, string[]> = {
  cs: ['cs', 'cs-CZ'],
  da: ['da', 'da-DK'],
  de: ['de', 'de-DE'],
  el: ['el', 'el-GR'],
  en: ['en', 'en-US'],
  es: ['es', 'es-ES'],
  et: ['et', 'et-EE'],
  fi: ['fi', 'fi-FI'],
  fr: ['fr', 'fr-FR'],
  hr: ['hr', 'hr-HR'],
  hu: ['hu', 'hu-HU'],
  it: ['it', 'it-IT'],
  lt: ['lt', 'lt-LT'],
  nl: ['nl', 'nl-NL'],
  pl: ['pl', 'pl-PL'],
  pt: ['pt', 'pt-BR'],
  ro: ['ro', 'ro-RO'],
  ru: ['ru', 'ru-RU'],
  si: ['si', 'si-LK'],
  sk: ['sk', 'sk-SK'],
  sl: ['sl', 'sl-SI'],
  tr: ['tr', 'tr-TR'],
  uk: ['uk', 'uk-UA'],
  zh: ['zh', 'zh-CN'],
};

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  cs: 'Čeština',
  da: 'Dansk',
  de: 'Deutsch',
  el: 'Ελληνικά',
  et: 'Eesti',
  es: 'Español',
  fr: 'Français',
  hr: 'Hrvatski',
  it: 'Italiano',
  lt: 'Lietuvos',
  hu: 'Magyar',
  nl: 'Nederlands',
  pl: 'Polski',
  pt: 'Português do Brasil',
  ro: 'Română',
  ru: 'Русский',
  si: 'සිංහල',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  fi: 'Suomi',
  tr: 'Türkçe',
  uk: 'Українська',
  zh: '简体中文',
};

let current: SupportedI18nLanguage | undefined;

export const getCurrent = (): SupportedI18nLanguage => {
  const systemLocale = getSystemLocale();
  const managedLocaleRaw = getManagedSettingOverride<string>(SettingsType.LOCALE);
  const isLocaleManaged = typeof managedLocaleRaw !== 'undefined';
  const managedLocale = isLocaleManaged ? normalizeManagedLocale(managedLocaleRaw) : undefined;

  if (!current) {
    const savedLocale = isLocaleManaged
      ? managedLocale
      : settings.restore<SupportedI18nLanguage | undefined>(SettingsType.LOCALE);
    const savedOverride = settings.restore<boolean | undefined>(SettingsType.LOCALE_OVERRIDE);
    const hasUserOverride = isLocaleManaged
      ? true
      : typeof savedOverride === 'boolean'
      ? savedOverride
      : Boolean(savedLocale && savedLocale !== systemLocale);

    current = savedLocale && hasUserOverride ? parseLocale(savedLocale) : systemLocale;
    return current;
  }

  if (isLocaleManaged && managedLocale) {
    current = managedLocale;
    return current;
  }

  // If there’s no override and the system locale changed, update the cache
  const hasOverride = settings.restore<boolean | undefined>(SettingsType.LOCALE_OVERRIDE) === true;
  if (!hasOverride && current !== systemLocale) {
    current = systemLocale;
  }
  return current;
};

const customReplacements: Record<string, string> = {
  brandName: config.name,
};

export const getText = (
  stringIdentifier: i18nLanguageIdentifier,
  paramReplacements?: Record<string, string>,
): string => {
  const strings = getCurrent();
  let translationText = LANGUAGES[strings][stringIdentifier] || LANGUAGES.en[stringIdentifier];

  if (!translationText) {
    throw new Error(`Translation for "${stringIdentifier}" could not be found.`);
  }

  const replacements: Record<string, string> = {...customReplacements, ...paramReplacements};
  for (const replacement of Object.keys(replacements)) {
    const regex = new RegExp(`{${replacement}}`, 'g');
    if (translationText.match(regex)) {
      translationText = translationText.replace(regex, replacements[replacement]);
    }
  }

  return translationText;
};

export const setLocale = (locale: string): void => {
  if (isSettingManaged(SettingsType.LOCALE)) {
    return;
  }
  current = parseLocale(locale);

  const systemLocale = getSystemLocale();
  const isOverride = current !== systemLocale;

  if (isOverride) {
    settings.save(SettingsType.LOCALE_OVERRIDE, true);
    settings.save(SettingsType.LOCALE, current);
  } else {
    settings.delete(SettingsType.LOCALE_OVERRIDE);
    settings.delete(SettingsType.LOCALE);
  }
};

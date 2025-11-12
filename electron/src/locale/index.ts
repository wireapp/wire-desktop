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
import {SettingsType} from '../settings/SettingsType';

export type i18nLanguageIdentifier = keyof typeof en;
export type i18nStrings = Record<i18nLanguageIdentifier, string>;
export type SupportedI18nLanguage = keyof typeof SUPPORTED_LANGUAGES;
export type SupportedI18nLanguageObject = Record<SupportedI18nLanguage, i18nStrings>;

const app = Electron.app || require('@electron/remote').app;

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
  if (!current) {
    // We care only about the language part and not the country (en_US, de_DE)
    const defaultLocale = parseLocale(app.getLocale().substring(0, 2));
    current = settings.restore(SettingsType.LOCALE, defaultLocale);
  }
  return current;
};

const parseLocale = (locale: string): SupportedI18nLanguage => {
  const languageKeys = Object.keys(SUPPORTED_LANGUAGES) as SupportedI18nLanguage[];
  return languageKeys.find(languageKey => languageKey === locale) || languageKeys[0];
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
  current = parseLocale(locale);
  settings.save(SettingsType.LOCALE, current);
};

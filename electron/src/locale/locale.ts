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
import {settings} from '../js/settings/ConfigurationPersistence';
import {SettingsType} from '../js/settings/SettingsType';

import {SupportedLanguage, SupportedLanguagesObject} from '../interfaces';

const app = Electron.app || Electron.remote.app;

const LANGUAGES: SupportedLanguagesObject = {
  cs: require('./strings-cs'),
  da: require('./strings-da'),
  de: require('./strings-de'),
  el: require('./strings-el'),
  en: require('./strings-en'),
  es: require('./strings-es'),
  et: require('./strings-et'),
  fi: require('./strings-fi'),
  fr: require('./strings-fr'),
  hr: require('./strings-hr'),
  hu: require('./strings-hu'),
  it: require('./strings-it'),
  lt: require('./strings-lt'),
  nl: require('./strings-nl'),
  pl: require('./strings-pl'),
  pt: require('./strings-pt'),
  ro: require('./strings-ro'),
  ru: require('./strings-ru'),
  sk: require('./strings-sk'),
  sl: require('./strings-sl'),
  tr: require('./strings-tr'),
  uk: require('./strings-uk'),
};

/* tslint:disable:object-literal-sort-keys */
const SUPPORTED_LANGUAGE = {
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
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  fi: 'Suomi',
  tr: 'Türkçe',
  uk: 'Українська',
};
/* tslint:enable:object-literal-sort-keys */

let current: SupportedLanguage | undefined;

const getSupportedLanguageKeys = (): SupportedLanguage[] => Object.keys(SUPPORTED_LANGUAGE) as SupportedLanguage[];

const getCurrent = (): SupportedLanguage => {
  if (!current) {
    // We care only about the language part and not the country (en_US, de_DE)
    const defaultLocale = parseLocale(app.getLocale().substr(0, 2));
    current = settings.restore(SettingsType.LOCALE, defaultLocale);
  }
  return current;
};

const parseLocale = (locale: string): SupportedLanguage => {
  const languageKeys = getSupportedLanguageKeys();
  return languageKeys.find(languageKey => languageKey === locale) || languageKeys[0];
};

const getText = (string_identifier: string): string => {
  const strings = getCurrent();
  return LANGUAGES[strings][string_identifier] || LANGUAGES.en[string_identifier] || '';
};

const setLocale = (locale: string): void => {
  current = parseLocale(locale);
  settings.save(SettingsType.LOCALE, current);
};

export {getCurrent, getText, LANGUAGES, setLocale, SUPPORTED_LANGUAGE};

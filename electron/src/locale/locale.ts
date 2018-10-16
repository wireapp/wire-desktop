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

import {strings as cs} from './strings-cs';
import {strings as da} from './strings-da';
import {strings as de} from './strings-de';
import {strings as el} from './strings-el';
import {strings as en} from './strings-en';
import {strings as es} from './strings-es';
import {strings as et} from './strings-et';
import {strings as fi} from './strings-fi';
import {strings as fr} from './strings-fr';
import {strings as hr} from './strings-hr';
import {strings as hu} from './strings-hu';
import {strings as it} from './strings-it';
import {strings as lt} from './strings-lt';
import {strings as nl} from './strings-nl';
import {strings as pl} from './strings-pl';
import {strings as pt} from './strings-pt';
import {strings as ro} from './strings-ro';
import {strings as ru} from './strings-ru';
import {strings as sk} from './strings-sk';
import {strings as sl} from './strings-sl';
import {strings as tr} from './strings-tr';
import {strings as uk} from './strings-uk';

import {SupportedLanguage, SupportedLanguagesObject} from '../interfaces';

const app = Electron.app || Electron.remote.app;

const LANGUAGES: SupportedLanguagesObject = {
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
  sk,
  sl,
  tr,
  uk,
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

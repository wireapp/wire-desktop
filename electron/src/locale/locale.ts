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
import * as config from '../js/config';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';

import {Supportedi18nLanguage, Supportedi18nLanguageObject, i18nLanguageIdentifier} from '../interfaces/';

const cs = require('../../locale/strings-cs');
const da = require('../../locale/strings-da');
const de = require('../../locale/strings-de');
const el = require('../../locale/strings-el');
const en = require('../../locale/strings-en');
const es = require('../../locale/strings-es');
const et = require('../../locale/strings-et');
const fi = require('../../locale/strings-fi');
const fr = require('../../locale/strings-fr');
const hr = require('../../locale/strings-hr');
const hu = require('../../locale/strings-hu');
const it = require('../../locale/strings-it');
const lt = require('../../locale/strings-lt');
const nl = require('../../locale/strings-nl');
const pl = require('../../locale/strings-pl');
const pt = require('../../locale/strings-pt');
const ro = require('../../locale/strings-ro');
const ru = require('../../locale/strings-ru');
const sk = require('../../locale/strings-sk');
const sl = require('../../locale/strings-sl');
const tr = require('../../locale/strings-tr');
const uk = require('../../locale/strings-uk');

const app = Electron.app || Electron.remote.app;

const LANGUAGES: Supportedi18nLanguageObject = {
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
const SUPPORTED_LANGUAGES = {
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

let current: Supportedi18nLanguage | undefined;

const getSupportedLanguageKeys = (): Supportedi18nLanguage[] =>
  Object.keys(SUPPORTED_LANGUAGES) as Supportedi18nLanguage[];

const getCurrent = (): Supportedi18nLanguage => {
  if (!current) {
    // We care only about the language part and not the country (en_US, de_DE)
    const defaultLocale = parseLocale(app.getLocale().substr(0, 2));
    current = settings.restore(SettingsType.LOCALE, defaultLocale);
  }
  return current;
};

const parseLocale = (locale: string): Supportedi18nLanguage => {
  const languageKeys = getSupportedLanguageKeys();
  return languageKeys.find(languageKey => languageKey === locale) || languageKeys[0];
};

const customReplacements: {[key: string]: string} = {
  appName: config.NAME,
};

const getText = (stringIdentifier: i18nLanguageIdentifier): string => {
  const strings = getCurrent();
  let str = LANGUAGES[strings][stringIdentifier] || LANGUAGES.en[stringIdentifier] || '';

  if (str) {
    for (const replacement of Object.keys(customReplacements)) {
      const regex = new RegExp(`{{${replacement}}}`, 'g');
      if (str.match(regex)) {
        str = str.replace(regex, customReplacements[replacement]);
      }
    }
  }

  return str;
};

const setLocale = (locale: string): void => {
  current = parseLocale(locale);
  settings.save(SettingsType.LOCALE, current);
};

export {getCurrent, getText, LANGUAGES, setLocale, SUPPORTED_LANGUAGES};

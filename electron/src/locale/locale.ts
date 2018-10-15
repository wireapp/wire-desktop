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

import * as electron from 'electron';
import {settings} from '../js/settings/ConfigurationPersistence';
import {SettingsType} from '../js/settings/SettingsType';

const app = electron.app || electron.remote.app;

const cs = require('./strings-cs');
const da = require('./strings-da');
const de = require('./strings-de');
const el = require('./strings-el');
const en = require('./strings-en');
const es = require('./strings-es');
const et = require('./strings-et');
const fi = require('./strings-fi');
const fr = require('./strings-fr');
const hr = require('./strings-hr');
const hu = require('./strings-hu');
const it = require('./strings-it');
const lt = require('./strings-lt');
const nl = require('./strings-nl');
const pl = require('./strings-pl');
const pt = require('./strings-pt');
const ro = require('./strings-ro');
const ru = require('./strings-ru');
const sk = require('./strings-sk');
const sl = require('./strings-sl');
const tr = require('./strings-tr');
const uk = require('./strings-uk');

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

let current;

const getSupportedLanguageKeys = () => Object.keys(SUPPORTED_LANGUAGES);

const getCurrent = () => {
  if (!current) {
    // We care only about the language part and not the country (en_US, de_DE)
    const defaultLocale = parseLocale(app.getLocale().substr(0, 2));
    current = settings.restore(SettingsType.LOCALE, defaultLocale);
  }
  return current;
};

const parseLocale = locale => {
  const languageKeys = getSupportedLanguageKeys();
  return languageKeys.find(languageKey => languageKey === locale) || languageKeys[0];
};

const getText = string_identifier => {
  const strings = eval(getCurrent());
  return strings[string_identifier] || en[string_identifier] || '';
};

const setLocale = locale => {
  current = parseLocale(locale);
  settings.save(SettingsType.LOCALE, current);
};

export {
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
  getCurrent,
  getText,
  setLocale,
  SUPPORTED_LANGUAGES,
};

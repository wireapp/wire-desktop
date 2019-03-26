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
import * as config from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';

import {Supportedi18nLanguage, Supportedi18nLanguageObject, i18nLanguageIdentifier} from '../interfaces/';

const cs_CZ = require('../../locale/cs-CZ');
const da_DK = require('../../locale/da-DK');
const de_DE = require('../../locale/de-DE');
const el_GR = require('../../locale/el-GR');
const en_US = require('../../locale/en-US');
const es_ES = require('../../locale/es-ES');
const et_EE = require('../../locale/et-EE');
const fi_FI = require('../../locale/fi-FI');
const fr_FR = require('../../locale/fr-FR');
const hr_HR = require('../../locale/hr-HR');
const hu_HU = require('../../locale/hu-HU');
const it_IT = require('../../locale/it-IT');
const lt_LT = require('../../locale/lt-LT');
const nl_NL = require('../../locale/nl-NL');
const pl_PL = require('../../locale/pl-PL');
const pt_BR = require('../../locale/pt-BR');
const ro_RO = require('../../locale/ro-RO');
const ru_RU = require('../../locale/ru-RU');
const sk_SK = require('../../locale/sk-SK');
const sl_SI = require('../../locale/sl-SI');
const tr_TR = require('../../locale/tr-TR');
const uk_UA = require('../../locale/uk-UA');

const app = Electron.app || Electron.remote.app;

const LANGUAGES: Supportedi18nLanguageObject = {
  cs_CZ,
  da_DK,
  de_DE,
  el_GR,
  en_US,
  es_ES,
  et_EE,
  fi_FI,
  fr_FR,
  hr_HR,
  hu_HU,
  it_IT,
  lt_LT,
  nl_NL,
  pl_PL,
  pt_BR,
  ro_RO,
  ru_RU,
  sk_SK,
  sl_SI,
  tr_TR,
  uk_UA,
};

/* tslint:disable:object-literal-sort-keys */
const SUPPORTED_LANGUAGES = {
  en_US: 'English',
  cs_CZ: 'Čeština',
  da_DK: 'Dansk',
  de_DE: 'Deutsch',
  el_GR: 'Ελληνικά',
  et_EE: 'Eesti',
  es_ES: 'Español',
  fr_FR: 'Français',
  hr_HR: 'Hrvatski',
  it_IT: 'Italiano',
  lt_LT: 'Lietuvos',
  hu_HU: 'Magyar',
  nl_NL: 'Nederlands',
  pl_PL: 'Polski',
  pt_BR: 'Português do Brasil',
  ro_RO: 'Română',
  ru_RU: 'Русский',
  sk_SK: 'Slovenčina',
  sl_SI: 'Slovenščina',
  fi_FI: 'Suomi',
  tr_TR: 'Türkçe',
  uk_UA: 'Українська',
};
/* tslint:enable:object-literal-sort-keys */

let current: Supportedi18nLanguage | undefined;

const getSupportedLanguageKeys = (): Supportedi18nLanguage[] =>
  Object.keys(SUPPORTED_LANGUAGES) as Supportedi18nLanguage[];

const getCurrent = (): Supportedi18nLanguage => {
  if (!current) {
    const defaultLocale = parseLocale(app.getLocale());
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
  maximumAccounts: config.MAXIMUM_ACCOUNTS.toString(),
};

const getText = (stringIdentifier: i18nLanguageIdentifier): string => {
  const strings = getCurrent();
  let str = LANGUAGES[strings][stringIdentifier] || LANGUAGES.en_US[stringIdentifier] || '';

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

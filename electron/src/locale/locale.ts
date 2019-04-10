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
  cs: cs_CZ,
  da: da_DK,
  de: de_DE,
  el: el_GR,
  en: en_US,
  es: es_ES,
  et: et_EE,
  fi: fi_FI,
  fr: fr_FR,
  hr: hr_HR,
  hu: hu_HU,
  it: it_IT,
  lt: lt_LT,
  nl: nl_NL,
  pl: pl_PL,
  pt: pt_BR,
  ro: ro_RO,
  ru: ru_RU,
  sk: sk_SK,
  sl: sl_SI,
  tr: tr_TR,
  uk: uk_UA,
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

const getText = (stringIdentifier: i18nLanguageIdentifier): string => {
  const strings = getCurrent();
  return LANGUAGES[strings][stringIdentifier] || LANGUAGES.en[stringIdentifier];
};

const setLocale = (locale: string): void => {
  current = parseLocale(locale);
  settings.save(SettingsType.LOCALE, current);
};

export {getCurrent, getText, LANGUAGES, setLocale, SUPPORTED_LANGUAGES};

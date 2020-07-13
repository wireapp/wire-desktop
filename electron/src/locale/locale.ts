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

import {config} from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import {SettingsType} from '../settings/SettingsType';

export type i18nLanguageIdentifier =
  | 'aboutReleases'
  | 'aboutUpdate'
  | 'aboutVersion'
  | 'aboutWebappVersion'
  | 'certificateVerifyProcManagerRetry'
  | 'certificateVerifyProcManagerShowDetails'
  | 'certificateVerifyProcManagerShowDetailsGoBack'
  | 'certificateVerifyProcManagerShowDetailsSaveCertificate'
  | 'certificateVerifyProcManagerShowDetailsTextChromium'
  | 'certificateVerifyProcManagerShowDetailsTextPinning'
  | 'certificateVerifyProcManagerShowDetailsTitle'
  | 'certificateVerifyProcManagerWarningBypass'
  | 'certificateVerifyProcManagerWarningTextChromium'
  | 'certificateVerifyProcManagerWarningTextPinning'
  | 'certificateVerifyProcManagerWarningTitle'
  | 'menuAbout'
  | 'menuAddPeople'
  | 'menuAppURL'
  | 'menuArchive'
  | 'menuBlock'
  | 'menuCall'
  | 'menuClose'
  | 'menuConversation'
  | 'menuCopy'
  | 'menuCut'
  | 'menuDelete'
  | 'menuDownloadDebugLogs'
  | 'menuEdit'
  | 'menuEnableSpellChecking'
  | 'menuFullScreen'
  | 'menuHelp'
  | 'menuHideApp'
  | 'menuHideOthers'
  | 'menuLeave'
  | 'menuLegal'
  | 'menuLicense'
  | 'menuLocale'
  | 'menuMinimize'
  | 'menuNextConversation'
  | 'menuNoSuggestions'
  | 'menuPaste'
  | 'menuPeople'
  | 'menuPing'
  | 'menuPreferences'
  | 'menuPreviousConversation'
  | 'menuPrivacy'
  | 'menuQuit'
  | 'menuRedo'
  | 'menuSavePictureAs'
  | 'menuSelectAll'
  | 'menuServices'
  | 'menuSettings'
  | 'menuShowAll'
  | 'menuShowHide'
  | 'menuSignOut'
  | 'menuStart'
  | 'menuStartup'
  | 'menuSupport'
  | 'menuUnarchive'
  | 'menuUndo'
  | 'menuVideoCall'
  | 'menuView'
  | 'menuWindow'
  | 'proxyPromptCancel'
  | 'proxyPromptHeadline'
  | 'proxyPromptOk'
  | 'proxyPromptPassword'
  | 'proxyPromptTitle'
  | 'proxyPromptUsername'
  | 'restartLater'
  | 'restartLocale'
  | 'restartNeeded'
  | 'restartNow'
  | 'trayOpen'
  | 'trayQuit'
  | 'unreadMessages'
  | 'wrapperAddAccount'
  | 'wrapperAddAccountErrorMessagePlural'
  | 'wrapperAddAccountErrorMessageSingular'
  | 'wrapperAddAccountErrorTitlePlural'
  | 'wrapperAddAccountErrorTitleSingular'
  | 'wrapperCreateTeam'
  | 'wrapperLogOut'
  | 'wrapperManageTeam'
  | 'wrapperRemoveAccount';

export type i18nStrings = Record<i18nLanguageIdentifier, string>;
export type SupportedI18nLanguage = keyof typeof SUPPORTED_LANGUAGES;
export type SupportedI18nLanguageObject = Record<SupportedI18nLanguage, i18nStrings>;

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
const zh_CN = require('../../locale/zh-CN');

const app = Electron.app || Electron.remote.app;

export const LANGUAGES: SupportedI18nLanguageObject = {
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
  zh: zh_CN,
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
  sk: ['sk', 'sk-SK'],
  sl: ['sl', 'sl-SI'],
  tr: ['tr', 'tr-TR'],
  uk: ['uk', 'uk-UA'],
  zh: ['zh', 'zh-CN'],
};

/* eslint-disable */
/* cspell:disable */
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
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  fi: 'Suomi',
  tr: 'Türkçe',
  uk: 'Українська',
  zh: '简体中文',
};
/* cspell:enable */
/* eslint-enable */

let current: SupportedI18nLanguage | undefined;

const getSupportedLanguageKeys = (): SupportedI18nLanguage[] =>
  Object.keys(SUPPORTED_LANGUAGES) as SupportedI18nLanguage[];

export const getCurrent = (): SupportedI18nLanguage => {
  if (!current) {
    // We care only about the language part and not the country (en_US, de_DE)
    const defaultLocale = parseLocale(app.getLocale().substr(0, 2));
    current = settings.restore(SettingsType.LOCALE, defaultLocale);
  }
  return current;
};

const parseLocale = (locale: string): SupportedI18nLanguage => {
  const languageKeys = getSupportedLanguageKeys();
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
  let str = LANGUAGES[strings][stringIdentifier] || LANGUAGES.en[stringIdentifier];

  const replacements: Record<string, string> = {...customReplacements, ...paramReplacements};
  for (const replacement of Object.keys(replacements)) {
    const regex = new RegExp(`{${replacement}}`, 'g');
    if (str.match(regex)) {
      str = str.replace(regex, replacements[replacement]);
    }
  }

  return str;
};

export const setLocale = (locale: string): void => {
  current = parseLocale(locale);
  settings.save(SettingsType.LOCALE, current);
};

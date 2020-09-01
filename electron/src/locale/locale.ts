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
  | 'changeEnvironmentModalConfirm'
  | 'changeEnvironmentModalText'
  | 'changeEnvironmentModalTitle'
  | 'menuAbout'
  | 'menuActualSize'
  | 'menuAddPeople'
  | 'menuAppURL'
  | 'menuArchive'
  | 'menuBlock'
  | 'menuCall'
  | 'menuClose'
  | 'menuConversation'
  | 'menuCopy'
  | 'menuCopyPicture'
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
  | 'menuMute'
  | 'menuNextConversation'
  | 'menuNoSuggestions'
  | 'menuNotificationSettings'
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
  | 'menuSwitchAccount'
  | 'menuUnarchive'
  | 'menuUndo'
  | 'menuVideoCall'
  | 'menuView'
  | 'menuWindow'
  | 'menuZoomIn'
  | 'menuZoomOut'
  | 'promptCancel'
  | 'promptOK'
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
  | 'webviewErrorDescription'
  | 'webviewErrorDescriptionSub'
  | 'webviewErrorRetryAction'
  | 'webviewErrorTitle'
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
export interface SupportedI18nLanguageData {
  code: string;
  name: string;
  strings: i18nStrings;
}

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
const si_LK = require('../../locale/si-LK');
const sk_SK = require('../../locale/sk-SK');
const sl_SI = require('../../locale/sl-SI');
const tr_TR = require('../../locale/tr-TR');
const uk_UA = require('../../locale/uk-UA');
const zh_CN = require('../../locale/zh-CN');

const app = Electron.app || Electron.remote.app;

/* eslint-disable */
/* cspell:disable */
const SUPPORTED_LANGUAGES: Record<string, SupportedI18nLanguageData> = {
  en: {name: 'English', code: 'en-US', strings: en_US},
  cs: {name: 'Čeština', code: 'cs-CZ', strings: cs_CZ},
  da: {name: 'Dansk', code: 'da-DK', strings: da_DK},
  de: {name: 'Deutsch', code: 'de-DE', strings: de_DE},
  el: {name: 'Ελληνικά', code: 'el-GR', strings: el_GR},
  et: {name: 'Eesti', code: 'et-EE', strings: et_EE},
  es: {name: 'Español', code: 'es-ES', strings: es_ES},
  fr: {name: 'Français', code: 'fr-FR', strings: fr_FR},
  hr: {name: 'Hrvatski', code: 'hr-HR', strings: hr_HR},
  it: {name: 'Italiano', code: 'it-IT', strings: it_IT},
  lt: {name: 'Lietuvos', code: 'lt-LT', strings: lt_LT},
  hu: {name: 'Magyar', code: 'hu-HU', strings: hu_HU},
  nl: {name: 'Nederlands', code: 'nl-NL', strings: nl_NL},
  pl: {name: 'Polski', code: 'pl-PL', strings: pl_PL},
  pt: {name: 'Português do Brasil', code: 'pt-BR', strings: pt_BR},
  ro: {name: 'Română', code: 'ro-RO', strings: ro_RO},
  ru: {name: 'Русский', code: 'ru-RU', strings: ru_RU},
  sk: {name: 'Slovenčina', code: 'sk-SK', strings: sk_SK},
  sl: {name: 'Slovenščina', code: 'sl-SI', strings: sl_SI},
  fi: {name: 'Suomi', code: 'fi-FI', strings: fi_FI},
  tr: {name: 'Türkçe', code: 'tr-TR', strings: tr_TR},
  uk: {name: 'Українська', code: 'uk-UA', strings: uk_UA},
  zh: {name: '简体中文', code: 'zh-CN', strings: zh_CN},
  si: {name: 'සිංහල', code: 'si-LK', strings: si_LK},
};
/* cspell:enable */
/* eslint-enable */

export const LANGUAGE_STRINGS = Object.keys(SUPPORTED_LANGUAGES).reduce<SupportedI18nLanguageObject>(
  (result, shortCode) => {
    result[shortCode] = SUPPORTED_LANGUAGES[shortCode].strings;
    return result;
  },
  {},
);

export const LANGUAGE_NAMES = Object.keys(SUPPORTED_LANGUAGES).reduce<Record<SupportedI18nLanguage, string>>(
  (result, shortCode) => {
    result[shortCode] = SUPPORTED_LANGUAGES[shortCode].name;
    return result;
  },
  {},
);

export const supportedSpellCheckLanguages = Object.keys(SUPPORTED_LANGUAGES).reduce<
  Record<SupportedI18nLanguage, [shortCode: string, languageCode: string]>
>((result, shortCode) => {
  result[shortCode] = [shortCode, SUPPORTED_LANGUAGES[shortCode].code];
  return result;
}, {});

let current: SupportedI18nLanguage | undefined;

export const getCurrent = (): SupportedI18nLanguage => {
  if (!current) {
    // We care only about the language part and not the country (en_US, de_DE)
    const defaultLocale = parseLocale(app.getLocale().substr(0, 2));
    current = settings.restore(SettingsType.LOCALE, defaultLocale);
  }
  return current;
};

const parseLocale = (locale: string): SupportedI18nLanguage => {
  const languageKeys = Object.keys(SUPPORTED_LANGUAGES);
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
  let str = LANGUAGE_STRINGS[strings][stringIdentifier] || LANGUAGE_STRINGS.en[stringIdentifier];

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

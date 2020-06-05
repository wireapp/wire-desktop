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

import {SUPPORTED_LANGUAGES as SupportedLanguages} from '../locale/locale';

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

export type Supportedi18nLanguage = keyof typeof SupportedLanguages;

export type Supportedi18nLanguageObject = Record<Supportedi18nLanguage, i18nStrings>;

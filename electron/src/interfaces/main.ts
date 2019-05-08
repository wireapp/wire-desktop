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

import {Menu, MenuItemConstructorOptions} from 'electron';

import {i18nLanguageIdentifier} from './locale';

export interface ElectronMenuWithI18n extends Menu {
  i18n?: i18nLanguageIdentifier;
}

export interface ElectronMenuWithTimeAndImage extends Menu {
  image?: string;
  timestamp?: string;
}

export interface ElectronMenuItemWithI18n extends MenuItemConstructorOptions {
  i18n?: i18nLanguageIdentifier;
  selector?: string;
  submenu?: ElectronMenuItemWithI18n[] | ElectronMenuWithI18n;
}

export type Schemata = Record<string, any>;

export interface OnHeadersReceivedDetails {
  responseHeaders: Record<string, string[]>;
}

export type OnHeadersReceivedCallback = (config: OnHeadersReceivedDetails & {cancel?: boolean}) => void;

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

import {i18nLanguageIdentifier} from './locale';

export interface ElectronMenuWithI18n extends Electron.Menu {
  i18n?: i18nLanguageIdentifier;
}

export interface ElectronMenuWithTimeAndImage extends Electron.Menu {
  image?: string;
  timestamp?: string;
}

export interface ElectronMenuItemWithI18n extends Electron.MenuItemConstructorOptions {
  i18n?: i18nLanguageIdentifier;
  selector?: string;
  submenu?: ElectronMenuItemWithI18n[] | ElectronMenuWithI18n;
}

export interface PinningResult {
  decoding?: boolean;
  errorMessage?: string;
  verifiedIssuerRootPubkeys?: boolean;
  verifiedPublicKeyInfo?: boolean;
}

export interface Schemata {
  [version: string]: any;
}

export type Point = [number, number];

export type Rectangle = {
  height: number;
  width: number;
  x: number;
  y: number;
};

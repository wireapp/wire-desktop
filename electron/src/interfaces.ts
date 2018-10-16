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
import {SUPPORTED_LANGUAGE} from './locale/locale';
import {strings as i18nStrings} from './locale/strings';

interface ElectronMenuWithI18n extends Electron.Menu {
  i18n?: string;
}

interface ElectronMenuItemWithI18n extends Electron.MenuItemConstructorOptions {
  i18n?: string;
  selector?: string;
  submenu?: ElectronMenuItemWithI18n[] | ElectronMenuWithI18n;
}

interface jsRsaSignPublicKey {
  algoid: string;
  algparam: string | null;
  keyhex: string;
}

interface OnHeadersReceivedDetails {
  responseHeaders: {
    [key: string]: string[];
  };
}

interface OpenGraphResult {
  title: string;
  type: string;
  url: string;
  site_name: string;
  description: string;
  image: {
    url: string;
    width: string;
    height: string;
  };
}

interface OpenGraphResultWithImage extends OpenGraphResult {
  image: {
    data: string;
    url: string;
    width: string;
    height: string;
  };
}

interface PinningResult {
  decoding?: boolean;
  errorMessage?: string;
  verifiedIssuerRootPubkeys?: boolean;
  verifiedPublicKeyInfo?: boolean;
}

interface Schemata {
  [version: string]: any;
}

type OnHeadersReceivedCallback = (config: OnHeadersReceivedDetails & {cancel?: boolean}) => void;

type Point = [number, number];

type Rectangle = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type SpawnCallback = (error: SpawnError | null, stdout: string) => void;

type SpawnError = Error & {code?: number | null; stdout?: string | null};

type Supportedi18nStrings = Partial<typeof i18nStrings>;

type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGE;

type SupportedLanguagesObject = {[id in SupportedLanguage]: any};

export {
  ElectronMenuItemWithI18n,
  jsRsaSignPublicKey,
  OnHeadersReceivedCallback,
  OnHeadersReceivedDetails,
  OpenGraphResult,
  OpenGraphResultWithImage,
  PinningResult,
  Point,
  Rectangle,
  Schemata,
  SpawnCallback,
  SpawnError,
  Supportedi18nStrings,
  SupportedLanguage,
  SupportedLanguagesObject,
};

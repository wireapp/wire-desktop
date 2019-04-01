/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

interface CommonConfig {
  adminUrl: string;
  appBase: string;
  buildNumber: string;
  copyright: string;
  customProtocolName: string;
  description: string;
  environment: 'internal' | 'production';
  legalUrl: string;
  licensesUrl: string;
  maximumAccounts: string;
  name: string;
  nameShort: string;
  privacyUrl: string;
  raygunApiKey: string;
  supportUrl: string;
  version: string;
  websiteUrl: string;
}

interface LinuxConfig {
  artifactName: string;
  categories: string;
  keywords: string;
  nameShort: string;
  targets: string[];
}

interface MacOSConfig {
  bundleId: string;
  category: string;
  certNameApplication: string | null;
  certNameInstaller: string | null;
  notarizeAppleId: string | null;
  notarizeApplePassword: string | null;
}

interface WindowsConfig {
  installerIconUrl: string;
  loadingGif: string;
  updateUrl: string;
}

export {CommonConfig, LinuxConfig, MacOSConfig, WindowsConfig};

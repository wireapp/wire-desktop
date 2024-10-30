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

/**
 * Settings that can be set in Wire's "init.json" file to configure our desktop app.
 *
 * Configuration file can be found here:
 *
 * Windows
 * Production: %APPDATA%\Wire\config\init.json
 * Internal: %APPDATA%\WireInternal\config\init.json
 *
 * Mac
 * Internal: ~/Library/Application\ Support/WireInternal/config/init.json
 * Production: ~/Library/Containers/com.wearezeta.zclient.mac/Data/Library/Application\ Support/Wire/config/init.json
 *
 */
export enum SettingsType {
  /** Start Wire on OS startup? */
  AUTO_LAUNCH = 'shouldAutoLaunch',
  /** Custom web app URL to use in on-premise deployments. The "env" setting must be set to "CUSTOM" to use this. */
  CUSTOM_WEBAPP_URL = 'customWebAppURL',
  /** Custom download path for the app. */
  DOWNLOAD_PATH = 'downloadPath',
  /** Enable spell checker in desktop app? */
  ENABLE_SPELL_CHECKING = 'enableSpellChecking',
  /** Which cloud environment ("PRODUCTION", "INTERNAL", "AVS", ...) to use when loading the webapp? */
  ENV = 'env',
  /** Start Wire desktop app in fullscreen? */
  FULL_SCREEN = 'fullscreen',
  /** Which language (ISO 639-1) should be used to load our web app (de, en, fr, etc.)? */
  LOCALE = 'locale',
  /** Defines the proxy server url (e.g. http://127.0.0.1:3128)
   *
   * https://github.com/wireapp/wire-desktop/wiki/Start-Parameters#use-authenticated-proxy-server
   * https://www.electronjs.org/docs/api/command-line-switches#--proxy-serveraddressport
   */
  PROXY_SERVER_URL = 'proxyServerURL',
  /** Show menu bar for desktop application? */
  SHOW_MENU_BAR = 'showMenu',
  /** At which part of the screen shall the app be initially rendered? */
  WINDOW_BOUNDS = 'bounds',
}

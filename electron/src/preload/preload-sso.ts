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
 * We can not use commonjs require in this module because SSO tab is loaded in a sandbox environment.
 * More info: https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
 * Therefore we have to use sync ipc messages to get window opener script from SingleSignOn instance.
 */
import {webFrame, ipcRenderer} from 'electron';

webFrame
  .executeJavaScript(ipcRenderer.sendSync('get-sso-window-opener-script'))
  .catch((error: Error) => console.warn(error));

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

import * as electron from 'electron';
import * as config from '../config';
import * as environment from '../environment';
import * as util from '../util';
import * as windowManager from '../window-manager';

const currentEnvironment = environment.getEnvironment();

const getPrimaryWindow = () => windowManager.getPrimaryWindow();

const reloadTemplate: electron.MenuItemConstructorOptions = {
  click: () => getPrimaryWindow().reload(),
  label: 'Reload',
};

const devToolsTemplate: electron.MenuItemConstructorOptions = {
  label: 'Toggle DevTools',
  submenu: [
    {
      accelerator: 'Alt+CmdOrCtrl+I',
      click: () => (getPrimaryWindow() as any).toggleDevTools(),
      label: 'Sidebar',
    },
    {
      click: () =>
        getPrimaryWindow().webContents.executeJavaScript(
          "document.getElementsByTagName('webview')[0].openDevTools({mode: 'detach'})"
        ),
      label: 'First',
    },
    {
      click: () =>
        getPrimaryWindow().webContents.executeJavaScript(
          "document.getElementsByTagName('webview')[1].openDevTools({mode: 'detach'})"
        ),
      label: 'Second',
    },
    {
      click: () =>
        getPrimaryWindow().webContents.executeJavaScript(
          "document.getElementsByTagName('webview')[2].openDevTools({mode: 'detach'})"
        ),
      label: 'Third',
    },
  ],
};

const createEnvironmentTemplate = (env): electron.MenuItemConstructorOptions => {
  return {
    checked: currentEnvironment === env,
    click: () => {
      environment.setEnvironment(env);
      getPrimaryWindow().reload();
    },
    label: util.capitalize(env),
    type: 'radio',
  };
};

const versionTemplate: electron.MenuItemConstructorOptions = {
  label: `Wire Version ${config.VERSION}`,
};

const chromeVersionTemplate: electron.MenuItemConstructorOptions = {
  label: `Chrome Version ${process.versions.chrome}`,
};

const electronVersionTemplate: electron.MenuItemConstructorOptions = {
  label: `Electron Version ${process.versions.electron}`,
};

const separatorTemplate: electron.MenuItemConstructorOptions = {
  type: 'separator',
};

const menuTemplate: electron.MenuItemConstructorOptions = {
  id: 'Developer',
  label: 'Developer',
  submenu: [
    devToolsTemplate,
    reloadTemplate,
    separatorTemplate,
    createEnvironmentTemplate(environment.TYPE.PRODUCTION),
    createEnvironmentTemplate(environment.TYPE.INTERNAL),
    createEnvironmentTemplate(environment.TYPE.STAGING),
    createEnvironmentTemplate(environment.TYPE.DEV),
    createEnvironmentTemplate(environment.TYPE.EDGE),
    createEnvironmentTemplate(environment.TYPE.LOCALHOST),
    separatorTemplate,
    versionTemplate,
    chromeVersionTemplate,
    electronVersionTemplate,
  ],
};

const menuItem = new electron.MenuItem(menuTemplate);

export {menuItem};

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
import * as config from '../js/config';
import * as environment from '../js/environment';
import * as util from '../js/util';
import * as windowManager from '../js/window-manager';

const currentEnvironment = environment.getEnvironment();

const getPrimaryWindow = () => windowManager.getPrimaryWindow();

const reloadTemplate: Electron.MenuItemConstructorOptions = {
  click: () => getPrimaryWindow().reload(),
  label: 'Reload',
};

const devToolsTemplate: Electron.MenuItemConstructorOptions = {
  label: 'Toggle DevTools',
  submenu: [
    {
      accelerator: 'Alt+CmdOrCtrl+I',
      click: () => getPrimaryWindow().webContents.toggleDevTools(),
      label: 'Sidebar',
    },
    {
      click: () => {
        const command = 'document.getElementsByTagName("webview")[0].openDevTools({mode: "detach"})';
        return getPrimaryWindow().webContents.executeJavaScript(command);
      },
      label: 'First',
    },
    {
      click: () => {
        const command = 'document.getElementsByTagName("webview")[1].openDevTools({mode: "detach"})';
        return getPrimaryWindow().webContents.executeJavaScript(command);
      },
      label: 'Second',
    },
    {
      click: () => {
        const command = 'document.getElementsByTagName("webview")[2].openDevTools({mode: "detach"})';
        return getPrimaryWindow().webContents.executeJavaScript(command);
      },
      label: 'Third',
    },
  ],
};

const createEnvironmentTemplate = (env: string): Electron.MenuItemConstructorOptions => {
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

const versionTemplate: Electron.MenuItemConstructorOptions = {
  label: `Wire Version ${config.VERSION || 'Development'}`,
};

const chromeVersionTemplate: Electron.MenuItemConstructorOptions = {
  label: `Chrome Version ${process.versions.chrome}`,
};

const electronVersionTemplate: Electron.MenuItemConstructorOptions = {
  label: `Electron Version ${process.versions.electron}`,
};

const separatorTemplate: Electron.MenuItemConstructorOptions = {
  type: 'separator',
};

const menuTemplate: Electron.MenuItemConstructorOptions = {
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

const menuItem = new Electron.MenuItem(menuTemplate);

export {menuItem};

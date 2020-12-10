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

import {MenuItem, MenuItemConstructorOptions, WebContents} from 'electron';

import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import * as lifecycle from '../runtime/lifecycle';
import {config} from '../settings/config';
import {executeJavaScriptWithoutResult} from '../lib/ElectronUtil';
import {WindowManager} from '../window/WindowManager';

const currentEnvironment = EnvironmentUtil.getEnvironment();

const reloadTemplate: MenuItemConstructorOptions = {
  click: () => {
    const primaryWindow = WindowManager.getPrimaryWindow();
    if (primaryWindow) {
      primaryWindow.reload();
    }
  },
  label: 'Reload',
};

export const openDevTools = async (webViewIndex?: number | true): Promise<void> => {
  const primaryWindow = WindowManager.getPrimaryWindow();

  if (primaryWindow) {
    if (typeof webViewIndex === 'number' && webViewIndex > 0) {
      const snippet = `document.getElementsByTagName("webview")[${webViewIndex - 1}].openDevTools({mode: "detach"})`;
      await executeJavaScriptWithoutResult(snippet, primaryWindow.webContents);
    } else {
      primaryWindow.webContents.toggleDevTools();
    }
  }
};

const devToolsTemplate: MenuItemConstructorOptions = {
  label: 'Toggle DevTools',
  submenu: [
    {
      accelerator: 'Alt+CmdOrCtrl+I',
      click: () => openDevTools(0),
      label: 'Sidebar',
    },
    {
      click: () => openDevTools(1),
      label: 'First',
    },
    {
      click: () => openDevTools(2),
      label: 'Second',
    },
    {
      click: () => openDevTools(3),
      label: 'Third',
    },
  ],
};

const createEnvironmentTemplates = (): MenuItemConstructorOptions[] => {
  const environmentTemplate: MenuItemConstructorOptions[] = [];
  const environments: Partial<typeof EnvironmentUtil.URL_WEBAPP> = {...EnvironmentUtil.URL_WEBAPP};
  delete environments.CUSTOM;

  for (const [backendType, backendURL] of Object.entries(environments)) {
    environmentTemplate.push({
      checked: currentEnvironment === backendType,
      click: async () => {
        EnvironmentUtil.setEnvironment(backendType as EnvironmentUtil.BackendType);
        await lifecycle.relaunch();
      },
      label: backendURL!.replace(/^https?:\/\//, ''),
      type: 'radio',
    });
  }
  return environmentTemplate;
};

const versionTemplate: MenuItemConstructorOptions = {
  enabled: false,
  label: `${config.name} Version ${config.version || 'Development'}`,
};

const chromeVersionTemplate: MenuItemConstructorOptions = {
  enabled: false,
  label: `Chrome Version ${process.versions.chrome}`,
};

const electronVersionTemplate: MenuItemConstructorOptions = {
  enabled: false,
  label: `Electron Version ${process.versions.electron}`,
};

const separatorTemplate: MenuItemConstructorOptions = {
  type: 'separator',
};

const menuTemplate: MenuItemConstructorOptions = {
  id: 'Developer',
  label: '&Developer',
  submenu: [
    devToolsTemplate,
    reloadTemplate,
    separatorTemplate,
    {
      enabled: false,
      label: 'Environment',
    },
    ...createEnvironmentTemplates(),
    separatorTemplate,
    versionTemplate,
    chromeVersionTemplate,
    electronVersionTemplate,
  ],
};

export const developerMenu = new MenuItem(menuTemplate);

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

import {BrowserWindow, MenuItem, MenuItemConstructorOptions} from 'electron';

import {executeJavaScriptWithoutResult} from '../lib/ElectronUtil';
import {getAvailebleEnvironments, setEnvironment} from '../runtime/EnvironmentUtil';
import * as lifecycle from '../runtime/lifecycle';
import {config} from '../settings/config';
import {WindowManager} from '../window/WindowManager';

const reloadTemplate: MenuItemConstructorOptions = {
  click: () => WindowManager.getPrimaryWindow()?.reload(),
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
  const environments = getAvailebleEnvironments();

  for (const env of environments) {
    environmentTemplate.push({
      checked: env.isActive,
      enabled: !!env.server,
      click: async () => {
        if (env.server) {
          setEnvironment(env.server);
          await lifecycle.relaunch();
        }
      },
      label: env.name,
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

const openWebRTCInternals = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
  }));

  win.loadURL('chrome://webrtc-internals/');
};

const webRTCInternalsTemplate: MenuItemConstructorOptions = {
  label: 'Toggle WebRTC Internals',
  click: () => openWebRTCInternals(),
};

const menuTemplate: MenuItemConstructorOptions = {
  id: 'Developer',
  label: '&Developer',
  submenu: [
    devToolsTemplate,
    reloadTemplate,
    separatorTemplate,
    webRTCInternalsTemplate,
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

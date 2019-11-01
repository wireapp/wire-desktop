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

import {MenuItem, app, dialog} from 'electron';
import * as openExternal from 'open';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';
import {gatherLogs, logDir} from '../logging/loggerUtils';
import * as EnvironmentUtil from '../runtime/EnvironmentUtil';
import {config} from '../settings/config';
import {settings} from '../settings/ConfigurationPersistence';
import * as WindowManager from '../window/WindowManager';

const currentEnvironment = EnvironmentUtil.getEnvironment();
const logger = getLogger(path.basename(__filename));

const reloadTemplate: Electron.MenuItemConstructorOptions = {
  click: () => {
    const primaryWindow = WindowManager.getPrimaryWindow();
    if (primaryWindow) {
      primaryWindow.reload();
    }
  },
  label: 'Reload',
};

const sendLogTemplate: Electron.MenuItemConstructorOptions = {
  click: async () => {
    const logText = await gatherLogs();
    const subject = encodeURIComponent('Wire Desktop Log');
    const body = encodeURIComponent(logText);
    const mailToLink = `mailto:support+web@wire.com?subject=${subject}&body=${body}`;
    try {
      await openExternal(mailToLink);
    } catch (error) {
      logger.error(error);

      const dialogResponse: number = await new Promise(resolve =>
        dialog.showMessageBox(
          {
            buttons: ['Cancel', 'OK'],
            message: 'Too many logs to send via email. Would you like to open the logs folder instead?',
            title: 'Too many logs',
          },
          response => resolve(response),
        ),
      );

      if (dialogResponse === 1) {
        await openExternal(logDir);
      }
    }
  },
  label: 'Send Debug Logs',
};

const devToolsTemplate: Electron.MenuItemConstructorOptions = {
  label: 'Toggle DevTools',
  submenu: [
    {
      accelerator: 'Alt+CmdOrCtrl+I',
      click: () => {
        const primaryWindow = WindowManager.getPrimaryWindow();
        if (primaryWindow) {
          primaryWindow.webContents.toggleDevTools();
        }
      },
      label: 'Sidebar',
    },
    {
      click: async () => {
        const primaryWindow = WindowManager.getPrimaryWindow();
        if (primaryWindow) {
          const command = 'document.getElementsByTagName("webview")[0].openDevTools({mode: "detach"})';
          await primaryWindow.webContents.executeJavaScript(command);
        }
      },
      label: 'First',
    },
    {
      click: async () => {
        const primaryWindow = WindowManager.getPrimaryWindow();
        if (primaryWindow) {
          const command = 'document.getElementsByTagName("webview")[1].openDevTools({mode: "detach"})';
          await primaryWindow.webContents.executeJavaScript(command);
        }
      },
      label: 'Second',
    },
    {
      click: async () => {
        const primaryWindow = WindowManager.getPrimaryWindow();
        if (primaryWindow) {
          const command = 'document.getElementsByTagName("webview")[2].openDevTools({mode: "detach"})';
          await primaryWindow.webContents.executeJavaScript(command);
        }
      },
      label: 'Third',
    },
  ],
};

const createEnvironmentTemplates = () => {
  const environmentTemplate: Electron.MenuItemConstructorOptions[] = [];
  for (const backendType of Object.values(EnvironmentUtil.BackendType)) {
    environmentTemplate.push({
      checked: currentEnvironment === backendType,
      click: () => {
        EnvironmentUtil.setEnvironment(backendType);
        settings.persistToFile();
        app.relaunch();
        app.quit();
      },
      label: EnvironmentUtil.URL_WEBAPP[backendType].replace(/^https?:\/\//, ''),
      type: 'radio',
    });
  }
  return environmentTemplate;
};

const versionTemplate: Electron.MenuItemConstructorOptions = {
  enabled: false,
  label: `${config.name} Version ${config.version || 'Development'}`,
};

const chromeVersionTemplate: Electron.MenuItemConstructorOptions = {
  enabled: false,
  label: `Chrome Version ${process.versions.chrome}`,
};

const electronVersionTemplate: Electron.MenuItemConstructorOptions = {
  enabled: false,
  label: `Electron Version ${process.versions.electron}`,
};

const separatorTemplate: Electron.MenuItemConstructorOptions = {
  type: 'separator',
};

const menuTemplate: Electron.MenuItemConstructorOptions = {
  id: 'Developer',
  label: '&Developer',
  submenu: [
    devToolsTemplate,
    reloadTemplate,
    sendLogTemplate,
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

export const menuItem = new MenuItem(menuTemplate);

/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

const {MenuItem} = require('electron');
const config = require('./../config');
const {Environment} = require('@wireapp/desktop-server');
const util = require('./../util');
const windowManager = require('./../window-manager');

const getPrimaryWindow = () => windowManager.getPrimaryWindow();

const reloadTemplate = {
  click: () => getPrimaryWindow().reload(),
  label: 'Reload',
};

const devToolsTemplate = {
  label: 'Toggle DevTools',
  submenu: [
    {
      accelerator: 'Alt+CmdOrCtrl+I',
      click: () => getPrimaryWindow().toggleDevTools(),
      label: 'Sidebar',
    },
    {
      click: () => getPrimaryWindow().webContents.executeJavaScript("document.getElementsByTagName('webview')[0].openDevTools()"),
      label: 'First',
    },
    {
      click: () => getPrimaryWindow().webContents.executeJavaScript("document.getElementsByTagName('webview')[1].openDevTools()"),
      label: 'Second',
    },
    {
      click: () => getPrimaryWindow().webContents.executeJavaScript("document.getElementsByTagName('webview')[2].openDevTools()"),
      label: 'Third',
    },
  ],
};

const versionTemplate = {
  label: 'Wire Version ' + config.VERSION,
};

const chromeVersionTemplate = {
  label: 'Chrome Version ' + process.versions.chrome,
};

const electronVersionTemplate = {
  label: 'Electron Version ' + process.versions.electron,
};

const separatorTemplate = {
  type: 'separator',
};

module.exports = async () => {
  return new MenuItem({
    id: 'Developer',
    label: 'Developer',
    submenu: [
      devToolsTemplate,
      reloadTemplate,
      separatorTemplate,
      await Environment.createEnvironmentTemplate(Environment.TYPE.PRODUCTION),
      await Environment.createEnvironmentTemplate(Environment.TYPE.INTERNAL),
      await Environment.createEnvironmentTemplate(Environment.TYPE.STAGING),
      await Environment.createEnvironmentTemplate(Environment.TYPE.DEV),
      await Environment.createEnvironmentTemplate(Environment.TYPE.EDGE),
      await Environment.createEnvironmentTemplate(Environment.TYPE.LOCALHOST),
      separatorTemplate,
      await Environment.createEnvironmentTemplateUpdaterDisabler(),
      separatorTemplate,
      versionTemplate,
      chromeVersionTemplate,
      electronVersionTemplate,
    ],
  });
};

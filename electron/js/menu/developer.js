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
const settings = require('./../lib/settings');
const env = settings.restore('env', config.INTERNAL);
const windowManager = require('./../window-manager');

function getPrimaryWindow() {
  return windowManager.getPrimaryWindow();
}


let reloadTemplate = {
  click: function() {getPrimaryWindow().reload();},
  label: 'Reload',
};

let devToolsTemplate = {
  label: 'Toggle DevTools',
  submenu: [
    {
      accelerator: 'Alt+CmdOrCtrl+I',
      click: function() {getPrimaryWindow().toggleDevTools();},
      label: 'Sidebar',
    },
    {
      click: function() {getPrimaryWindow().webContents.executeJavaScript("document.getElementsByTagName('webview')[0].openDevTools()");},
      label: 'First',
    },
    {
      click: function() {getPrimaryWindow().webContents.executeJavaScript("document.getElementsByTagName('webview')[1].openDevTools()");},
      label: 'Second',
    },
    {
      click: function() {getPrimaryWindow().webContents.executeJavaScript("document.getElementsByTagName('webview')[2].openDevTools()");},
      label: 'Third',
    },
  ],
};

let devProductionTemplate = {
  checked: env === config.PROD,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.PROD);
  },
  label: 'Production',
  type: 'radio',
};

let devInternalTemplate = {
  checked: env === config.INTERNAL,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.INTERNAL);
  },
  label: 'Internal',
  type: 'radio',
};

let devStagingTemplate = {
  checked: env === config.STAGING,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.STAGING);
  },
  label: 'Staging',
  type: 'radio',
};

let devDevTemplate = {
  checked: env === config.DEV,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.DEV);
  },
  label: 'Dev',
  type: 'radio',
};

let devEdgeTemplate = {
  checked: env === config.EDGE,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.EDGE);
  },
  label: 'Edge',
  type: 'radio',
};

let devLocalhostTemplate = {
  checked: env === config.LOCALHOST,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.LOCALHOST);
  },
  label: 'Localhost',
  type: 'radio',
};

let versionTemplate = {
  label: 'Wire Version ' + config.VERSION,
};

let chromeVersionTemplate = {
  label: 'Chrome Version ' + process.versions.chrome,
};

let electronVersionTemplate = {
  label: 'Electron Version ' + process.versions.electron,
};

let separatorTemplate = {
  type: 'separator',
};

let menuTemplate = {
  id: 'Developer',
  label: 'Developer',
  submenu: [
    devToolsTemplate,
    reloadTemplate,
    separatorTemplate,
    devProductionTemplate,
    devInternalTemplate,
    devStagingTemplate,
    devDevTemplate,
    devEdgeTemplate,
    devLocalhostTemplate,
    separatorTemplate,
    versionTemplate,
    chromeVersionTemplate,
    electronVersionTemplate,
  ],
};

module.exports = new MenuItem(menuTemplate);

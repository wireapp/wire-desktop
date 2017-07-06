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
  label: 'Reload',
  click: function() {getPrimaryWindow().reload();},
};

let devToolsTemplate = {
  label: 'Toggle DevTools',
  accelerator: 'Alt+CmdOrCtrl+I',
  click: function() {getPrimaryWindow().toggleDevTools();},
};

let devProductionTemplate = {
  label: 'Production',
  type: 'radio',
  checked: env === config.PROD,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.PROD);
  },
};

let devInternalTemplate = {
  label: 'Internal',
  type: 'radio',
  checked: env === config.INTERNAL,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.INTERNAL);
  },
};

let devStagingTemplate = {
  label: 'Staging',
  type: 'radio',
  checked: env === config.STAGING,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.STAGING);
  },
};

let devDevTemplate = {
  label: 'Dev',
  type: 'radio',
  checked: env === config.DEV,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.DEV);
  },
};

let devEdgeTemplate = {
  label: 'Edge',
  type: 'radio',
  checked: env === config.EDGE,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.EDGE);
  },
};

let devLocalhostTemplate = {
  label: 'Localhost',
  type: 'radio',
  checked: env === config.LOCALHOST,
  click: function() {
    getPrimaryWindow().reload();
    settings.save('env', config.LOCALHOST);
  },
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

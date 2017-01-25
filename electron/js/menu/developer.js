/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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

'use strict';

const {MenuItem} = require('electron');
const config = require('./../config');
const windowManager = require('./../window-manager');
const init = require('./../lib/init');
const env = init.restore('env', 'internal');

function getPrimaryWindow() {
  return windowManager.getPrimaryWindow();
}


var reloadTemplate = {
  label: 'Reload',
  click: function() {getPrimaryWindow().reload();},
};

var devToolsTemplate = {
  label: 'Toggle DevTools',
  accelerator: 'Alt+CmdOrCtrl+I',
  click: function() {getPrimaryWindow().toggleDevTools();},
};

var devProductionTemplate = {
  label: 'Production',
  type: 'radio',
  checked: env === 'production',
  click: function() {
    getPrimaryWindow().loadURL(config.PRODUCTION_URL);
    init.save('env', 'production');
  },
};

var devInternalTemplate = {
  label: 'Internal',
  type: 'radio',
  checked: env === 'internal',
  click: function() {
    getPrimaryWindow().loadURL(config.INTERNAL_URL);
    init.save('env', 'internal');
  },
};

var devStagingTemplate = {
  label: 'Staging',
  type: 'radio',
  checked: env === 'staging',
  click: function() {getPrimaryWindow().loadURL(config.STAGING_URL);},
};

var devDevTemplate = {
  label: 'Dev',
  type: 'radio',
  checked: env === 'dev',
  click: function() {
    getPrimaryWindow().loadURL(config.DEV_URL);
    init.save('env', 'dev');
  },
};

var devEdgeTemplate = {
  label: 'Edge',
  type: 'radio',
  checked: env === 'edge',
  click: function() {
    getPrimaryWindow().loadURL(config.EDGE_URL);
    init.save('env', 'edge');
  },
};

var devBennyTemplate = {
  label: 'Cryptobox',
  type: 'radio',
  checked: env === 'cryptobox',
  click: function() {
    getPrimaryWindow().loadURL(config.BENNY_URL);
    init.save('env', 'cryptobox');
  },
};

var devLocalhostTemplate = {
  label: 'Localhost',
  type: 'radio',
  checked: env === 'localhost',
  click: function() {
    getPrimaryWindow().loadURL(config.LOCALHOST_URL);
    init.save('env', 'localhost');
  },
};

var versionTemplate = {
  label: 'Wire Version ' + config.VERSION,
};

var chromeVersionTemplate = {
  label: 'Chrome Version ' + process.versions.chrome,
};

var electronVersionTemplate = {
  label: 'Electron Version ' + process.versions.electron,
};

var separatorTemplate = {
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
    devBennyTemplate,
    devLocalhostTemplate,
    separatorTemplate,
    versionTemplate,
    chromeVersionTemplate,
    electronVersionTemplate,
  ],
};

module.exports = new MenuItem(menuTemplate);

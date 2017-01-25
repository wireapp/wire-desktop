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
const env = init.restore('env', config.INTERNAL);

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
  checked: env === config.PROD,
  click: function() {
    getPrimaryWindow().loadURL(config.PROD_URL);
    init.save('env', config.PROD);
  },
};

var devInternalTemplate = {
  label: 'Internal',
  type: 'radio',
  checked: env === config.INTERNAL,
  click: function() {
    getPrimaryWindow().loadURL(config.INTERNAL_URL);
    init.save('env', config.INTERNAL);
  },
};

var devStagingTemplate = {
  label: 'Staging',
  type: 'radio',
  checked: env === config.STAGING,
  click: function() {
    getPrimaryWindow().loadURL(config.STAGING_URL);
    init.save('env', config.STAGING);
  },
};

var devDevTemplate = {
  label: 'Dev',
  type: 'radio',
  checked: env === config.DEV,
  click: function() {
    getPrimaryWindow().loadURL(config.DEV_URL);
    init.save('env', config.DEV);
  },
};

var devEdgeTemplate = {
  label: 'Edge',
  type: 'radio',
  checked: env === config.EDGE,
  click: function() {
    getPrimaryWindow().loadURL(config.EDGE_URL);
    init.save('env', config.EDGE);
  },
};

var devBennyTemplate = {
  label: 'Cryptobox',
  type: 'radio',
  checked: env === config.CRYPTO,
  click: function() {
    getPrimaryWindow().loadURL(config.BENNY_URL);
    init.save('env', config.CRYPTO);
  },
};

var devLocalhostTemplate = {
  label: 'Localhost',
  type: 'radio',
  checked: env === config.LOCALHOST,
  click: function() {
    getPrimaryWindow().loadURL(config.LOCALHOST_URL);
    init.save('env', config.LOCALHOST);
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

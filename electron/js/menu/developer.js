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
  click: function() {getPrimaryWindow().loadURL(config.PRODUCTION_URL);},
};

var devStagingTemplate = {
  label: 'Staging',
  click: function() {getPrimaryWindow().loadURL(config.STAGING_URL);},
};

var devDevTemplate = {
  label: 'Dev',
  click: function() {getPrimaryWindow().loadURL(config.DEV_URL);},
};

var devEdgeTemplate = {
  label: 'Edge',
  click: function() {getPrimaryWindow().loadURL(config.EDGE_URL);},
};

var devBennyTemplate = {
  label: 'Cryptobox',
  click: function() {getPrimaryWindow().loadURL(config.BENNY_URL);},
};

var devLocalhostTemplate = {
  label: 'Localhost',
  click: function() {getPrimaryWindow().loadURL(config.LOCALHOST_URL);},
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

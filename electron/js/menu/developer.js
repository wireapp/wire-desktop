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

const {BrowserWindow, MenuItem} = require('electron');
const config = require('./../config');

function getBrowserWindow() {
  return BrowserWindow.getFocusedWindow();
}

var reloadTemplate = {
  label: 'Reload',
  click: function() {getBrowserWindow().reload();},
};

var devToolsTemplate = {
  label: 'Toggle DevTools',
  accelerator: 'Alt+CmdOrCtrl+I',
  click: function() {getBrowserWindow().toggleDevTools();},
};

var devProductionTemplate = {
  label: 'Production',
  click: function() {getBrowserWindow().loadURL(config.PRODUCTION_URL);},
};

var devStagingTemplate = {
  label: 'Staging',
  click: function() {getBrowserWindow().loadURL(config.STAGING_URL);},
};

var devDevTemplate = {
  label: 'Dev',
  click: function() {getBrowserWindow().loadURL(config.DEV_URL);},
};

var devEdgeTemplate = {
  label: 'Edge',
  click: function() {getBrowserWindow().loadURL(config.EDGE_URL);},
};

var devLocalhostTemplate = {
  label: 'Localhost',
  click: function() {getBrowserWindow().loadURL(config.LOCALHOST_URL);},
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
    devLocalhostTemplate,
    separatorTemplate,
    versionTemplate,
    chromeVersionTemplate,
    electronVersionTemplate,
  ],
};

module.exports = new MenuItem(menuTemplate);

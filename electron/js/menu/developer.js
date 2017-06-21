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

'use strict';

const {MenuItem} = require('electron');
const config = require('./../config');
const windowManager = require('./../window-manager');
const init = require('./../lib/init');
const env = init.restore('env', config.INTERNAL);

function getPrimaryWindow() {
  return windowManager.getPrimaryWindow();
}

const reloadTemplate = {
  click() {
    getPrimaryWindow().reload();
  },
  label: 'Reload',
};

const devToolsTemplate = {
  accelerator: 'Alt+CmdOrCtrl+I',
  click() {
    getPrimaryWindow().toggleDevTools();
  },
  label: 'Toggle DevTools',
};

const devProductionTemplate = {
  checked: env === config.PROD,
  click() {
    getPrimaryWindow().loadURL(config.PROD_URL);
    init.save('env', config.PROD);
  },
  label: 'Production',
  type: 'radio',
};

const devInternalTemplate = {
  checked: env === config.INTERNAL,
  click() {
    getPrimaryWindow().loadURL(config.INTERNAL_URL);
    init.save('env', config.INTERNAL);
  },
  label: 'Internal',
  type: 'radio',
};

const devStagingTemplate = {
  checked: env === config.STAGING,
  click() {
    getPrimaryWindow().loadURL(config.STAGING_URL);
    init.save('env', config.STAGING);
  },
  label: 'Staging',
  type: 'radio',
};

const devDevTemplate = {
  checked: env === config.DEV,
  click() {
    getPrimaryWindow().loadURL(config.DEV_URL);
    init.save('env', config.DEV);
  },
  label: 'Dev',
  type: 'radio',
};

const devEdgeTemplate = {
  checked: env === config.EDGE,
  click() {
    getPrimaryWindow().loadURL(config.EDGE_URL);
    init.save('env', config.EDGE);
  },
  label: 'Edge',
  type: 'radio',
};

const devBennyTemplate = {
  checked: env === config.CRYPTO,
  click() {
    getPrimaryWindow().loadURL(config.BENNY_URL);
    init.save('env', config.CRYPTO);
  },
  label: 'Cryptobox',
  type: 'radio',
};

const devLocalhostTemplate = {
  checked: env === config.LOCALHOST,
  click() {
    getPrimaryWindow().loadURL(config.LOCALHOST_URL);
    init.save('env', config.LOCALHOST);
  },
  label: 'Localhost',
  type: 'radio',
};

const versionTemplate = {
  label: `Wire Version ${config.VERSION}`,
};

const chromeVersionTemplate = {
  label: `Chrome Version ${process.versions.chrome}`,
};

const electronVersionTemplate = {
  label: `Electron Version ${process.versions.electron}`,
};

const separatorTemplate = {
  type: 'separator',
};

const menuTemplate = {
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

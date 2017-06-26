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

const {BrowserWindow, app} = require('electron');

// Configuration persistence
const ConfigurationPersistence = require('../electron/js/lib/ConfigurationPersistence');
global.init = new ConfigurationPersistence({file: '/tmp/trayTestConfigFile.json'});

const assert = require('assert');
const path = require('path');

const tray = require('../electron/js/menu/tray');

describe('tray', () => {

  describe('#updateBadgeIcon()', () => {

    it('should update badge according to window title', (done) => {
      let window = new BrowserWindow();
      window.loadURL('file://' + path.join(__dirname, 'fixtures', 'badge.html'));
      window.webContents.on('dom-ready', function() {
        tray.updateBadgeIcon(window);
        setTimeout(function() {
          if (process.platform === 'darwin') {
            assert.equal(app.getBadgeCount(), 2);
          }
          done();
        }, 75);
      });
    });
  });

});

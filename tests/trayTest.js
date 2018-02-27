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

'use strict';

const {BrowserWindow, app} = require('electron');
const environment = require('../electron/js/environment');

const assert = require('assert');
const path = require('path');

const tray = require('../electron/js/menu/tray');

describe('tray', () => {

  describe('#updateBadgeIcon()', () => {

    it('should update badge according to window title', (done) => {
      const window = new BrowserWindow();

      window.loadURL('file://' + path.join(__dirname, 'fixtures', 'badge.html'));
      window.webContents.on('dom-ready', () => {
        tray.updateBadgeIcon(window, 10);

        if (environment.platform.IS_MAC_OS) {
          assert.equal(app.getBadgeCount(), 10);
        }

        done();
      });
    });
  });

});

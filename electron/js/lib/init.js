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



const app = require('electron').app || require('electron').remote.app;

const fs = require('fs');
const path = require('path');

const INIT_JSON = path.join(app.getPath('userData'), 'init.json');


module.exports = (function() {
  function save(name, value) {
    let data = {};
    try {
      data = JSON.parse(fs.readFileSync(INIT_JSON, 'utf8'));
    } catch (error) {
      console.log(INIT_JSON, 'not found!');
    }
    data[name] = value;
    fs.writeFileSync(INIT_JSON, JSON.stringify(data));
  }

  function restore(name, defaultValue) {
    try {
      const data = JSON.parse(fs.readFileSync(INIT_JSON, 'utf8'));
      const value = data[name];
      return typeof value !== 'undefined' ? value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  return {
    save,
    restore,
  };
}());

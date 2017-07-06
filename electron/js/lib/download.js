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



const fs = require('fs');
const imageType = require('image-type');

const {dialog} = require('electron');

module.exports = function(fileName, bytes) {
  return new Promise(function (resolve, reject) {
    let options = {};
    let type = imageType(bytes);

    if (fileName) {
      options.defaultPath = fileName;
    }

    if (type && type.ext) {
      options.filters = [
        {name: 'Images', extensions: [type.ext]},
      ];
    }

    dialog.showSaveDialog(options, function (chosenPath) {
      if (chosenPath !== undefined) {
        fs.writeFile(chosenPath, new Buffer(bytes.buffer), function(error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else {
        reject('no path specified');
      }
    });
  });
};

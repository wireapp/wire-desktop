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



const og = require('open-graph');

const arrayify = require('./arrayify');
const base64Images = require('./base64-image');

function updateMetaDataWithImages(meta, images) {
  images = arrayify(images);
  if (images.length > 1) {
    meta.image.url = images;
  } else if (images.length > 0) {
    meta.image.url = meta.image.data = images[0]; // old version uses data attr
  } else {
    delete meta.image;
  }
  return meta;
}

module.exports = function(url, limit = 1, callback) {
  // older version excepts 2 paramaters (url, callback)
  if (typeof(limit) === 'function') {
    callback = limit;
    limit = 1;
  }

  og(url, function(error, meta) {
    if (error) return callback(error);
    if (meta.image && meta.image.url) {
      base64Images(meta.image.url, limit, function(dataURIs) {
        callback(null, updateMetaDataWithImages(meta, dataURIs));
      });
    } else {
      callback(null, meta);
    }
  });
};

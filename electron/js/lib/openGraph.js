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
const request = require('request');


function updateMetaDataWithImage(meta, image) {
  if (image) {
    meta.image.data = image;
  } else {
    delete meta.image;
  }
  return meta;
}


function bufferToBase64(buffer, mimetype) {
  const bufferBase64encoded = Buffer.from(buffer).toString('base64');
  return 'data:' + mimetype + ';base64,' + bufferBase64encoded;
}


function arrayify(obj = []) {
  return Array.isArray(obj) ? obj : [obj];
};


function fetchImageAsBase64(url) {
  return new Promise((resolve) => {
    request({url: encodeURI(url), encoding: null}, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(bufferToBase64(body, response.headers['content-type']));
      } else {
        // we just skip images that failed to download
        resolve();
      }
    });
  });
}


function fetchOpenGraphData(url) {
  return new Promise((resolve, reject) => {
    og(url, function(error, meta) {
      if (error) {
        reject(error);
      } else {
        resolve(meta);
      }
    });
  });
}


module.exports = function(url, callback) {
  fetchOpenGraphData(url)
    .then((meta) => {
      if (meta.image && meta.image.url) {
        const imageUrl = arrayify(meta.image.url)[0]
        return fetchImageAsBase64(imageUrl)
          .then((uri) => updateMetaDataWithImage(meta, uri))
          .catch(() => meta);
      }
      return meta;
    })
    .then((meta) => {
      callback(null, meta);
    })
    .catch((error) => {
      callback(error);
    });
};

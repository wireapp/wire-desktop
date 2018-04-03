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


const openGraph = require('open-graph');
const request = require('request');

const arrayify = (value = []) => Array.isArray(value) ? value : [value];

const bufferToBase64 = (buffer, mimeType) => {
  const bufferBase64encoded = Buffer.from(buffer).toString('base64');
  return 'data:' + mimeType + ';base64,' + bufferBase64encoded;
};

const fetchImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    request({encoding: null, url: encodeURI(url)}, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(bufferToBase64(body, response.headers['content-type']));
      } else {
        // we just skip images that failed to download
        resolve();
      }
    });
  });
};

const fetchOpenGraphData = (url) => {
  return new Promise((resolve, reject) => {
    openGraph(url, (error, meta) => error ? reject(error) : resolve(meta));
  });
};

const updateMetaDataWithImage = (meta, image) => {
  if (image) {
    meta.image.data = image;
  } else {
    delete meta.image;
  }

  return meta;
};

const getOpenGraphData = (url, callback) => {
  return fetchOpenGraphData(url)
    .then((meta) => {
      if (meta.image && meta.image.url) {
        const [imageUrl] = arrayify(meta.image.url);

        return fetchImageAsBase64(imageUrl)
          .then((uri) => updateMetaDataWithImage(meta, uri))
          .catch(() => meta);
      }

      return meta;
    })
    .then((meta) => {
      if (callback) {
        callback(null, meta);
      }

      return meta;
    })
    .catch((error) => {
      if (callback) {
        callback(error);
      }

      throw error;
    });
};

module.exports = getOpenGraphData;

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

const openGraphParse = require('open-graph').parse;
const request = require('request');
const urlUtil = require('url');

const arrayify = (value = []) => (Array.isArray(value) ? value : [value]);

const bufferToBase64 = (buffer, mimeType) => {
  const bufferBase64encoded = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${bufferBase64encoded}`;
};

const fetchImageAsBase64 = url => {
  return new Promise(resolve => {
    request({encoding: null, url: encodeURI(url)}, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(bufferToBase64(body, response.headers['content-type']));
      } else {
        // we just skip images that failed to download
        resolve();
      }
    });
  });
};

const fetchOpenGraphData = url => {
  const CONTENT_TYPE_LIMIT = 1e7; // 10MB
  const parsedUrl = urlUtil.parse(url);
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : urlUtil.parse(`http://${url}`);

  return new Promise((resolve, reject) => {
    const getContentRequest = request.get(urlUtil.format(normalizedUrl), (error, response, body) => {
      return error ? reject(error) : resolve(body);
    });

    getContentRequest.on('response', ({headers}) => {
      const contentType = headers['content-type'] || '';
      const contentLength = parseInt(headers['content-length'] || '0', 10);

      const isHtmlContentType = contentType.match(/.*text\/html/);
      const isTooLarge = contentLength > CONTENT_TYPE_LIMIT;

      if (!isHtmlContentType || isTooLarge) {
        throw new Error(`Unhandled format for open graph generation ('${contentType}' of size '${contentLength}')`);
        getContentRequest.abort();
      }
    });

    let requestCurrentSize = 0;
    getContentRequest.on('data', buffer => {
      requestCurrentSize += buffer.length;
      if (requestCurrentSize > CONTENT_TYPE_LIMIT) {
        throw new Error(`File size too big for open graph generation ('${contentLength}')`);
        getContentRequest.abort();
      }
    });
  }).then(openGraphParse);
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
    .then(meta => {
      if (meta.image && meta.image.url) {
        const [imageUrl] = arrayify(meta.image.url);

        return fetchImageAsBase64(imageUrl)
          .then(uri => updateMetaDataWithImage(meta, uri))
          .catch(() => meta);
      }

      return meta;
    })
    .then(meta => {
      if (callback) {
        callback(null, meta);
      }

      return meta;
    })
    .catch(error => {
      if (callback) {
        callback(error);
      }

      throw error;
    });
};

module.exports = getOpenGraphData;

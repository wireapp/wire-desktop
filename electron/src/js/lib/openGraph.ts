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

import * as request from 'request';
import * as urlUtil from 'url';
const openGraphParse = require('open-graph');

import {OpenGraphResult} from '../../interfaces';

const arrayify = <T>(value: T[] | T = []): T[] => (Array.isArray(value) ? value : [value]);

const bufferToBase64 = (buffer: string, mimeType?: string): string => {
  const bufferBase64encoded = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${bufferBase64encoded}`;
};

const fetchImageAsBase64 = (url: string): Promise<string | undefined> => {
  const IMAGE_SIZE_LIMIT = 5e6; // 5MB
  return new Promise(resolve => {
    const imageRequest = request({encoding: null, url: encodeURI(url)}, (error, response, body: string) => {
      if (!error && response.statusCode === 200) {
        resolve(bufferToBase64(body, response.headers['content-type']));
      } else {
        // we just skip images that failed to download
        resolve();
      }
    });

    let currentDownloadSize = 0;
    imageRequest.on('data', buffer => {
      currentDownloadSize += buffer.length;
      if (currentDownloadSize > IMAGE_SIZE_LIMIT) {
        imageRequest.abort();
        resolve();
      }
    });
  });
};

const fetchOpenGraphData = (url: string): Promise<OpenGraphResult> => {
  const CONTENT_SIZE_LIMIT = 1e6; // ~1MB
  const parsedUrl = urlUtil.parse(url);
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : urlUtil.parse(`http://${url}`);

  const parseHead = (body: string) => {
    const [head] = body.match(/<head>[\s\S]*?<\/head>/) || [''];
    return openGraphParse(head);
  };

  return new Promise<string>((resolve, reject) => {
    const getContentRequest = request.get(urlUtil.format(normalizedUrl), (error, response, body: string) => {
      return error ? reject(error) : resolve(body);
    });

    getContentRequest.on('response', ({headers}) => {
      const contentType = headers['content-type'] || '';
      const isHtmlContentType = contentType.match(/.*text\/html/);

      if (!isHtmlContentType) {
        getContentRequest.abort();
        throw new Error(`Unhandled format for open graph generation ('${contentType}')`);
      }
    });

    let partialBody = '';
    getContentRequest.on('data', buffer => {
      const chunk = buffer.toString();
      partialBody += chunk;
      if (chunk.match('</head>') || partialBody.length > CONTENT_SIZE_LIMIT) {
        getContentRequest.abort();
        resolve(partialBody);
      }
    });
  }).then(parseHead);
};

const updateMetaDataWithImage = (meta: OpenGraphResult, image?: string): OpenGraphResult => {
  if (image) {
    meta.image.data = image;
  } else {
    delete meta.image;
  }

  return meta;
};

const getOpenGraphData = (url: string, callback: (error: Error | null, meta?: OpenGraphResult) => void) => {
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

export {getOpenGraphData};

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

import axios, {AxiosRequestConfig} from 'axios';
import {IncomingMessage} from 'http';
import {parse as parseUrl} from 'url';
const {parse: openGraphParse} = require('open-graph');

import {OpenGraphResult} from '../interfaces/';
import {USER_AGENT} from '../js/config';
import {getLogger} from '../js/getLogger';

const logger = getLogger('openGraph');

axios.defaults.adapter = require('axios/lib/adapters/http'); // always use Node.js adapter

const arrayify = <T>(value: T[] | T = []): T[] => (Array.isArray(value) ? value : [value]);

const bufferToBase64 = (buffer: Buffer, mimeType: string): string => {
  const bufferBase64encoded = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${bufferBase64encoded}`;
};

const fetchImageAsBase64 = async (url: string): Promise<string | undefined> => {
  const IMAGE_SIZE_LIMIT = 5e6; // 5MB

  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': USER_AGENT,
    },
    maxContentLength: IMAGE_SIZE_LIMIT,
    method: 'get',
    responseType: 'arraybuffer',
    url,
  };

  const response = await axios.request<Buffer>(axiosConfig);

  if (response.status !== 200) {
    throw new Error(`Request failed with status code "${response.status}".`);
  }

  const contentType = response.headers['content-type'] || '';
  const isImageContentType = contentType.match(/.*image\/*/);

  if (!isImageContentType) {
    throw new Error(`Unhandled format for open graph image ('${contentType}')`);
  }

  return bufferToBase64(response.data, contentType);
};

const axiosWithContentLimit = (config: AxiosRequestConfig, contentLimit: number): Promise<string> => {
  const CancelToken = axios.CancelToken;
  const cancelSource = CancelToken.source();

  config.responseType = 'stream';
  config.cancelToken = cancelSource.token;

  return new Promise((resolve, reject) => {
    let partialBody = '';

    return axios
      .request<IncomingMessage>(config)
      .then(response => {
        if (response.status !== 200) {
          return reject(`Request failed with status code "${response.status}".`);
        }

        const contentType = response.headers['content-type'] || '';
        const isHtmlContentType = contentType.match(/.*text\/html/);

        if (!isHtmlContentType) {
          reject(`Unhandled format for open graph generation ('${contentType}')`);
        }

        response.data.on('data', buffer => {
          const chunk = buffer.toString();
          partialBody += chunk;

          if (chunk.match('</head>') || partialBody.length > contentLimit) {
            cancelSource.cancel();
            resolve(partialBody);
          }
        });

        response.data.on('error', reject);
        response.data.on('end', () => resolve(partialBody));
      })
      .catch(error => {
        logger.error(error);
        return axios.isCancel(error) ? Promise.resolve('') : Promise.reject(error);
      });
  });
};

const fetchOpenGraphData = async (url: string): Promise<OpenGraphResult> => {
  const CONTENT_SIZE_LIMIT = 1e6; // ~1MB
  const parsedUrl = parseUrl(url);
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : parseUrl(`http://${url}`);

  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': USER_AGENT,
    },
    method: 'get',
    url: normalizedUrl.href,
  };

  const body = await axiosWithContentLimit(axiosConfig, CONTENT_SIZE_LIMIT);
  const [head] = body.match(/<head>[\s\S]*?<\/head>/) || [''];

  if (!head) {
    logger.error('No head end tag found in website.');
  }

  return openGraphParse(head);
};

const updateMetaDataWithImage = (meta: OpenGraphResult, imageData?: string): OpenGraphResult => {
  if (!meta.image) {
    meta.image = {};
  }

  if (imageData) {
    meta.image.data = imageData;
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
          .catch(error => {
            logger.error(error);
            return meta;
          });
      } else {
        logger.error('OpenGraph metadata contains no image.');
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
      logger.error(error);

      if (callback) {
        callback(error);
      }
    });
};

const getOpenGraphDataAsync = async (url: string): Promise<OpenGraphResult> => {
  let meta;

  try {
    meta = await fetchOpenGraphData(url);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  if (meta.image && meta.image.url) {
    const [imageUrl] = arrayify(meta.image.url);

    const uri = await fetchImageAsBase64(imageUrl);
    return updateMetaDataWithImage(meta, uri);
  } else {
    logger.error('OpenGraph metadata contains no image.');
  }

  return meta;
};

export {getOpenGraphData, getOpenGraphDataAsync};

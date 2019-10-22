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

import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {parse as parseContentType} from 'content-type';
import {IncomingMessage} from 'http';
import {decode as iconvDecode} from 'iconv-lite';
import {Data as OpenGraphResult, parse as openGraphParse} from 'open-graph';
import {parse as parseUrl} from 'url';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

type GetDataCallback = (error: Error | null, meta?: OpenGraphResult) => void;

const logger = getLogger(__filename);

axios.defaults.adapter = require('axios/lib/adapters/http'); // always use Node.js adapter

const arrayify = <T>(value: T[] | T = []): T[] => (Array.isArray(value) ? value : [value]);

const bufferToBase64 = (buffer: Buffer, mimeType: string): string => {
  const bufferBase64encoded = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${bufferBase64encoded}`;
};

const fetchImageAsBase64 = async (url: string): Promise<string | undefined> => {
  const IMAGE_SIZE_LIMIT = 5e6; // 5MB
  const parsedUrl = parseUrl(encodeURI(url));
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : parseUrl(`http://${url}`);

  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': config.userAgent,
    },
    maxContentLength: IMAGE_SIZE_LIMIT,
    method: 'get',
    responseType: 'arraybuffer',
    url: normalizedUrl.href,
  };

  let response;

  try {
    response = await axiosWithCookie<Buffer>(axiosConfig);
  } catch (error) {
    logger.error(error);
    throw new Error(`Request failed with status code "${error.response.status}": "${error.response.statusText}".`);
  }

  let contentType;

  try {
    contentType = parseContentType(response.headers['content-type']);
  } catch (error) {
    throw new Error(`Could not parse content type: "${error.message}"`);
  }

  const isImageContentType = contentType.type.match(/.*image\/.*/);

  if (!isImageContentType) {
    throw new Error(`Unhandled format for open graph image ('${contentType}')`);
  }

  return bufferToBase64(response.data, contentType.type);
};

export const axiosWithCookie = async <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  try {
    const response = await axios.request<T>({...config, maxRedirects: 0, withCredentials: true});
    return response;
  } catch (error) {
    const response = error.response;
    if (!response) {
      throw error;
    }
    if (response.status === 301 || response.status === 302) {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const Cookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
        config.headers = {...config.headers, Cookie};
      }
    }
    return axios.request(config);
  }
};

export const axiosWithContentLimit = (config: AxiosRequestConfig, contentLimit: number): Promise<string> => {
  const CancelToken = axios.CancelToken;
  const cancelSource = CancelToken.source();

  config.responseType = 'stream';
  config.cancelToken = cancelSource.token;

  return new Promise((resolve, reject) => {
    let partialBody = '';

    return axiosWithCookie<IncomingMessage>(config)
      .then(response => {
        let contentType;

        try {
          contentType = parseContentType(response.headers['content-type']);
        } catch (error) {
          return reject(new Error(`Could not parse content type: "${error.message}"`));
        }

        if (!contentType.type.includes('text/html')) {
          return reject(new Error(`Unhandled format for open graph generation ('${contentType}')`));
        }

        const charset = contentType.parameters.charset;

        response.data.on('data', (buffer: Buffer) => {
          let chunk = buffer.toString('utf8');

          if (charset) {
            try {
              chunk = iconvDecode(buffer, charset);
            } catch (error) {
              logger.error(`Could not decode content: "${error.message}."`);
            }
          }

          partialBody += chunk;

          if (chunk.match('</head>') || partialBody.length > contentLimit) {
            cancelSource.cancel();
            resolve(partialBody);
          }
        });

        response.data.on('error', reject);
        response.data.on('end', () => resolve(partialBody));
      })
      .catch(error => (axios.isCancel(error) ? Promise.resolve('') : Promise.reject(error)));
  });
};

const fetchOpenGraphData = async (url: string): Promise<OpenGraphResult> => {
  const CONTENT_SIZE_LIMIT = 1e6; // ~1MB
  const parsedUrl = parseUrl(encodeURI(url));
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : parseUrl(`http://${url}`);

  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': config.userAgent,
    },
    method: 'get',
    url: normalizedUrl.href,
  };

  const body = await axiosWithContentLimit(axiosConfig, CONTENT_SIZE_LIMIT);
  // For the regex, see https://regex101.com/r/U62pCH/1
  const matches = body.match(/.*property=(["'])og:.+?\1.*/gim) || [''];

  if (!matches) {
    throw new Error('No open graph tags found in website.');
  }

  const openGraphTags = matches.join(' ');

  return openGraphParse(openGraphTags);
};

const updateMetaDataWithImage = (meta: OpenGraphResult, imageData?: string): OpenGraphResult => {
  if (!meta.image) {
    meta.image = {};
  }

  if (imageData && typeof meta.image === 'object' && !Array.isArray(meta.image)) {
    meta.image.data = imageData;
  } else {
    delete meta.image;
  }

  return meta;
};

export const getOpenGraphData = async (url: string, callback: GetDataCallback): Promise<void> => {
  try {
    let meta = await fetchOpenGraphData(url);

    if (Array.isArray(meta.image)) {
      meta.image = meta.image[0];
    }

    if (typeof meta.image === 'object' && !Array.isArray(meta.image) && meta.image.url) {
      const [imageUrl] = arrayify(meta.image.url);

      const uri = await fetchImageAsBase64(imageUrl);
      meta = await updateMetaDataWithImage(meta, uri);
    } else {
      delete meta.image;
    }

    if (callback) {
      callback(null, meta);
    }
  } catch (error) {
    if (callback) {
      callback(error);
    } else {
      logger.info(error);
    }
  }
};

export const getOpenGraphDataAsync = async (url: string): Promise<OpenGraphResult> => {
  const metadata = await fetchOpenGraphData(url);

  if (Array.isArray(metadata.image)) {
    metadata.image = metadata.image[0];
  }

  if (typeof metadata.image === 'object' && !Array.isArray(metadata.image) && metadata.image.url) {
    const [imageUrl] = arrayify(metadata.image.url);

    const uri = await fetchImageAsBase64(imageUrl);
    return updateMetaDataWithImage(metadata, uri);
  } else {
    delete metadata.image;
    return metadata;
  }
};

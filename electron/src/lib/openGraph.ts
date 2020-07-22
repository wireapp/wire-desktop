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
import {parse as parseContentType, ParsedMediaType} from 'content-type';
import {IncomingMessage} from 'http';
import {decode as iconvDecode} from 'iconv-lite';
import {Data as OpenGraphResult, parse as openGraphParse} from 'open-graph';
import {parse as parseUrl} from 'url';
import * as path from 'path';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger(path.basename(__filename));

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
    if (error.response?.status && error?.response?.statusText) {
      throw new Error(`Request failed with status code "${error.response.status}": "${error.response.statusText}".`);
    }
    throw new Error(`Request failed: ${error.message}`);
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

export const axiosWithContentLimit = async (config: AxiosRequestConfig, contentLimit: number): Promise<string> => {
  const cancelSource = axios.CancelToken.source();

  config.responseType = 'stream';
  config.cancelToken = cancelSource.token;

  try {
    const response = await axiosWithCookie<IncomingMessage>(config);
    let contentType: ParsedMediaType;

    try {
      contentType = parseContentType(response.headers['content-type']);
    } catch (error) {
      throw new Error(`Could not parse content type: "${error.message}"`);
    }

    if (!contentType.type.includes('text/html')) {
      throw new Error(`Unhandled format for open graph generation ("${contentType}")`);
    }

    const charset = contentType.parameters.charset;

    const body = await new Promise<string>((resolve, reject) => {
      let partialBody = '';

      // Info: The 'end' event handler must be first: https://github.com/electron/electron/issues/12545#issuecomment-380478350
      response.data
        .on('end', () => resolve(partialBody))
        .on('error', error => reject(error))
        .on('data', (buffer: Buffer) => {
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
    });

    return body;
  } catch (error) {
    if (axios.isCancel(error)) {
      return '';
    }

    const mappedError = error.isAxiosError ? new Error(`Request failed with code "${error.code}"`) : error;
    throw mappedError;
  }
};

const fetchOpenGraphData = async (url: string): Promise<OpenGraphResult> => {
  const CONTENT_SIZE_LIMIT = 1e6; // ~1MB
  const parsedUrl = parseUrl(encodeURI(url));
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : parseUrl(`http://${url}`);

  if (normalizedUrl.host?.endsWith('twitter.com')) {
    config.userAgent = 'Twitterbot/1.0';
  }

  const axiosConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': config.userAgent,
    },
    method: 'get',
    url: normalizedUrl.href,
  };

  const body = await axiosWithContentLimit(axiosConfig, CONTENT_SIZE_LIMIT);
  return openGraphParse(body);
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

export const getOpenGraphDataAsync = async (url: string): Promise<OpenGraphResult> => {
  const metadata = await fetchOpenGraphData(url);

  if (!metadata.description && !metadata.image && !metadata.type && !metadata.url) {
    throw new Error('No openGraph data found');
  }

  if (Array.isArray(metadata.image)) {
    metadata.image = metadata.image[0];
  }

  if (typeof metadata.image === 'object' && metadata.image.url) {
    const [imageUrl] = arrayify(metadata.image.url);

    try {
      const uri = await fetchImageAsBase64(imageUrl);
      return updateMetaDataWithImage(metadata, uri);
    } catch (error) {
      logger.warn(error);
    }
  }

  delete metadata.image;
  return metadata;
};

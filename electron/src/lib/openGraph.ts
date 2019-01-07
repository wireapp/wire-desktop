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
import * as urlUtil from 'url';
const {parse: openGraphParse} = require('open-graph');

import {OpenGraphResult} from '../interfaces/';
import {USER_AGENT} from '../js/config';

const arrayify = <T>(value: T[] | T = []): T[] => (Array.isArray(value) ? value : [value]);

const bufferToBase64 = (buffer: string, mimeType?: string): string => {
  const bufferBase64encoded = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${bufferBase64encoded}`;
};

const fetchImageAsBase64 = async (url: string): Promise<string | undefined> => {
  const IMAGE_SIZE_LIMIT = 5e6; // 5MB

  const axiosConfig: AxiosRequestConfig = {
    maxContentLength: IMAGE_SIZE_LIMIT,
    method: 'get',
    url,
  };

  try {
    const response = await axios.request<string>(axiosConfig);

    if (response.status !== 200) {
      throw new Error(`Request failed with status code "${response.status}".`);
    }

    return bufferToBase64(response.data, response.headers['content-type']);
  } catch (error) {
    // we just skip images that failed to download
    console.error(error);
    return;
  }
};

const fetchOpenGraphData = async (url: string): Promise<OpenGraphResult> => {
  const CONTENT_SIZE_LIMIT = 1e6; // ~1MB
  const parsedUrl = urlUtil.parse(url);
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : urlUtil.parse(`http://${url}`);

  axios.interceptors.response.use(
    response => {
      const contentType = response.headers['content-type'] || '';
      const isHtmlContentType = contentType.match(/.*text\/html/);

      if (!isHtmlContentType) {
        throw new Error(`Unhandled format for open graph generation ('${contentType}')`);
      }

      return response;
    },
    error => Promise.reject(error)
  );

  const axiosConfig: AxiosRequestConfig = {
    maxContentLength: CONTENT_SIZE_LIMIT,
    method: 'get',
    url: normalizedUrl.href,
    onDownloadProgress(progress) {
      console.log('progress', progress);
    },
  };

  const response = await axios.request<string>(axiosConfig);
  if (response.status !== 200) {
    throw new Error(`Request failed with status code "${response.status}".`);
  }

  const [head] = response.data.match(/<head>[\s\S]*?<\/head>/) || [''];
  return openGraphParse(head);
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

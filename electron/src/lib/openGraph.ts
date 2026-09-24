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
import {decode as iconvDecode} from 'iconv-lite';

import {lookup as dnsLookup} from 'dns';
import {basename} from 'path';
import {URL} from 'url';

import {parseHTML, OpenGraphMetadata} from '@wireapp/open-graph';

import {normalizeAndValidateUrl, requestLinkPreviewStream} from './linkPreviewRequest';
import type {LinkPreviewRequestDependencies} from './linkPreviewRequest';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger(basename(__filename));
const linkPreviewRequestDependencies: LinkPreviewRequestDependencies = {dnsLookup};

function arrayify<T>(value: T[] | T = []): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

function bufferToBase64(buffer: Buffer, mimeType: string): string {
  const encodedBuffer = Buffer.from(buffer).toString('base64');

  return `data:${mimeType};base64,${encodedBuffer}`;
}

const fetchImageAsBase64 = async (url: string): Promise<string | undefined> => {
  const IMAGE_SIZE_LIMIT = 5e6; // 5MB
  const parsedUrl = new URL(encodeURI(url));
  const normalizedUrl = parsedUrl.protocol ? parsedUrl : new URL(`http://${url}`);

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
  } catch (error: any) {
    if (error.response?.status && error?.response?.statusText) {
      throw new Error(`Request failed with status code "${error.response.status}": "${error.response.statusText}".`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }

  let contentType;

  try {
    contentType = parseContentType(response.headers['content-type']);
  } catch (error: any) {
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
  } catch (error: any) {
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
    return await axios.request(config);
  }
};

export async function fetchOpenGraphHtml(url: string, userAgent: string, contentLimit: number): Promise<string> {
  try {
    const response = await requestLinkPreviewStream(
      {
        responseType: 'stream',
        url,
        userAgent,
      },
      linkPreviewRequestDependencies,
    );
    let contentType: ParsedMediaType;

    try {
      contentType = parseContentType(response.headers['content-type']);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Could not parse content type: "${error.message}"`);
      }

      throw new Error('Could not parse content type: unknown error');
    }

    if (!contentType.type.includes('text/html')) {
      throw new Error(`Unhandled format for open graph generation (Content-Type is "${contentType}")`);
    }

    const charset = contentType.parameters.charset;

    const body = await new Promise<string>((resolve, reject) => {
      let partialBody = '';

      // Info: The 'end' event handler must be first: https://github.com/electron/electron/issues/12545#issuecomment-380478350
      response.data
        .on('end', () => {
          return resolve(partialBody);
        })
        .on('error', error => {
          return reject(error);
        })
        .on('data', (buffer: Buffer) => {
          let chunk = buffer.toString('utf8');

          if (charset !== undefined) {
            try {
              chunk = iconvDecode(buffer, charset);
            } catch (error: unknown) {
              if (error instanceof Error) {
                logger.error(`Could not decode content: "${error.message}."`);
              } else {
                logger.error('Could not decode content: unknown error.');
              }
            }
          }

          partialBody += chunk;

          if (chunk.includes('</head>') || partialBody.length > contentLimit) {
            response.data.destroy();
            resolve(partialBody);
          }
        });
    });

    return body;
  } catch (error: unknown) {
    if (axios.isCancel(error)) {
      return '';
    }

    if (axios.isAxiosError(error)) {
      throw new Error(`Request failed with code "${error.code}"`);
    }

    throw error;
  }
}

function isTwitterHost(hostname: string): boolean {
  return hostname === 'twitter.com' || hostname.endsWith('.twitter.com');
}

function getOpenGraphUserAgent(hostname: string): string {
  if (isTwitterHost(hostname)) {
    return 'Twitterbot/1.0';
  }

  return config.userAgent;
}

async function fetchOpenGraphData(url: string) {
  const contentSizeLimit = 1e6; // ~1MB
  const normalizedUrlResult = normalizeAndValidateUrl(url, undefined);
  if (normalizedUrlResult.isErr) {
    return Promise.reject(normalizedUrlResult.error);
  }

  const normalizedUrl = normalizedUrlResult.value;
  const userAgent = getOpenGraphUserAgent(normalizedUrl.hostname);

  const body = await fetchOpenGraphHtml(normalizedUrl.href, userAgent, contentSizeLimit);
  return parseHTML(body);
}

const updateMetaDataWithImage = (meta: OpenGraphMetadata, url?: string) => {
  meta.image ??= {};

  if (url && typeof meta.image === 'object' && !Array.isArray(meta.image)) {
    meta.image.url = url;
  } else {
    delete meta.image;
  }

  return meta;
};

export const getOpenGraphDataAsync = async (url: string): Promise<OpenGraphMetadata> => {
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
    } catch (error: any) {
      logger.warn(error);
    }
  }

  delete metadata.image;
  return metadata;
};

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

import axios from 'axios';
import {parse as parseContentType, ParsedMediaType} from 'content-type';
import {decode as iconvDecode} from 'iconv-lite';

import {lookup as dnsLookup} from 'dns';
import {basename} from 'path';

import {parseHTML, OpenGraphImage, OpenGraphMetadata} from '@wireapp/open-graph';

import {normalizeAndValidateUrl, requestLinkPreviewImage, requestLinkPreviewStream} from './linkPreviewRequest';
import type {LinkPreviewImageResponse, LinkPreviewRequestDependencies} from './linkPreviewRequest';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger(basename(__filename));
const linkPreviewRequestDependencies: LinkPreviewRequestDependencies = {dnsLookup};

function bufferToBase64(buffer: Buffer, mimeType: string): string {
  const encodedBuffer = Buffer.from(buffer).toString('base64');

  return `data:${mimeType};base64,${encodedBuffer}`;
}

async function fetchImageAsBase64(url: string, userAgent: string): Promise<string> {
  const imageSizeLimit = 5e6; // 5MB
  let response: LinkPreviewImageResponse;

  try {
    response = await requestLinkPreviewImage(
      {
        maximumContentLength: imageSizeLimit,
        responseType: 'arraybuffer',
        url,
        userAgent,
      },
      linkPreviewRequestDependencies,
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response !== undefined) {
      if (error.response.status !== undefined && typeof error.response.statusText === 'string') {
        throw new Error(`Request failed with status code "${error.response.status}": "${error.response.statusText}".`);
      }
    }

    if (error instanceof Error) {
      throw new Error(`Request failed: ${error.message}`);
    }

    throw new Error('Request failed: unknown error');
  }

  let contentType: ParsedMediaType;

  try {
    contentType = parseContentType(response.headers['content-type']);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Could not parse content type: "${error.message}"`);
    }

    throw new Error('Could not parse content type: unknown error');
  }

  const isImageContentType = contentType.type.startsWith('image/');

  if (!isImageContentType) {
    throw new Error(`Unhandled format for open graph image ('${contentType}')`);
  }

  return bufferToBase64(response.data, contentType.type);
}

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

type OpenGraphPage = {
  metadata: OpenGraphMetadata;
  userAgent: string;
};

function isNonEmptyString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  return value.length > 0;
}

function isOpenGraphImage(image: OpenGraphMetadata['image']): image is OpenGraphImage {
  if (typeof image !== 'object') {
    return false;
  }

  if (image === null) {
    return false;
  }

  if (Array.isArray(image)) {
    return false;
  }

  return true;
}

function hasOpenGraphImageUrl(image: OpenGraphMetadata['image']): image is OpenGraphImage & {url: string} {
  if (isOpenGraphImage(image)) {
    return isNonEmptyString(image.url);
  }

  return false;
}

function hasOpenGraphData(metadata: OpenGraphMetadata): boolean {
  if (isNonEmptyString(metadata.description)) {
    return true;
  }

  if (metadata.image !== undefined) {
    return true;
  }

  if (isNonEmptyString(metadata.type)) {
    return true;
  }

  return isNonEmptyString(metadata.url);
}

async function fetchOpenGraphData(url: string): Promise<OpenGraphPage> {
  const contentSizeLimit = 1e6; // ~1MB
  const normalizedUrlResult = normalizeAndValidateUrl(url, undefined);
  if (normalizedUrlResult.isErr) {
    return Promise.reject(normalizedUrlResult.error);
  }

  const normalizedUrl = normalizedUrlResult.value;
  const userAgent = getOpenGraphUserAgent(normalizedUrl.hostname);

  const body = await fetchOpenGraphHtml(normalizedUrl.href, userAgent, contentSizeLimit);
  return {
    metadata: parseHTML(body),
    userAgent,
  };
}

function updateMetaDataWithImage(metadata: OpenGraphMetadata, imageDataUrl: string): OpenGraphMetadata {
  if (isOpenGraphImage(metadata.image)) {
    metadata.image.url = imageDataUrl;
    return metadata;
  }

  delete metadata.image;
  return metadata;
}

export async function getOpenGraphDataAsync(url: string): Promise<OpenGraphMetadata> {
  const openGraphPage = await fetchOpenGraphData(url);
  const metadata = openGraphPage.metadata;

  if (!hasOpenGraphData(metadata)) {
    throw new Error('No openGraph data found');
  }

  if (Array.isArray(metadata.image)) {
    metadata.image = metadata.image[0];
  }

  if (hasOpenGraphImageUrl(metadata.image)) {
    try {
      const imageDataUrl = await fetchImageAsBase64(metadata.image.url, openGraphPage.userAgent);
      return updateMetaDataWithImage(metadata, imageDataUrl);
    } catch (error: unknown) {
      logger.warn(error);
    }
  }

  delete metadata.image;
  return metadata;
}

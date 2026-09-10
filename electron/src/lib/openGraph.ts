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

import * as path from 'path';

import {fetchOpenGraphData, fetchResource, OpenGraphImage, OpenGraphMetadata} from '@wireapp/open-graph';

import {getLogger} from '../logging/getLogger';
import {config} from '../settings/config';

const logger = getLogger(path.basename(__filename));

const CONTENT_SIZE_LIMIT = 1e6;
const IMAGE_SIZE_LIMIT = 5e6;

export type OpenGraphResult = OpenGraphMetadata & {image?: OpenGraphImage & {data?: string}};

const arrayify = <T>(value: T[] | T = []): T[] => (Array.isArray(value) ? value : [value]);

const userAgentFor = (url: string): string => {
  try {
    const {hostname} = new URL(url.includes('://') ? url : `https://${url}`);
    if (hostname === 'twitter.com' || hostname.endsWith('.twitter.com')) {
      return 'Twitterbot/1.0';
    }
  } catch {}
  return config.userAgent;
};

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const {body, contentType} = await fetchResource(url, config.userAgent, {maxBodyLength: IMAGE_SIZE_LIMIT});
  const mimeType = contentType.split(';')[0].trim().toLowerCase();

  if (!mimeType.startsWith('image/')) {
    throw new Error(`Unhandled format for open graph image ('${contentType}')`);
  }

  return `data:${mimeType};base64,${body.toString('base64')}`;
};

export const getOpenGraphDataAsync = async (url: string): Promise<OpenGraphResult> => {
  const metadata: OpenGraphResult = await fetchOpenGraphData(url, {
    maxBodyLength: CONTENT_SIZE_LIMIT,
    userAgent: userAgentFor(url),
  });

  if (!metadata.description && !metadata.image && !metadata.type && !metadata.url) {
    throw new Error('No openGraph data found');
  }

  if (Array.isArray(metadata.image)) {
    metadata.image = metadata.image[0];
  }

  const imageUrl = typeof metadata.image === 'object' ? arrayify(metadata.image.url)[0] : undefined;

  if (imageUrl) {
    try {
      metadata.image!.data = await fetchImageAsBase64(imageUrl);
      return metadata;
    } catch (error: any) {
      logger.warn(error);
    }
  }

  delete metadata.image;
  return metadata;
};

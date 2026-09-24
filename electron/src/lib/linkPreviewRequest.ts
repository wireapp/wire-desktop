/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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
import ipaddr from 'ipaddr.js';
import {Result} from 'true-myth';

import {lookup as defaultDnsLookup} from 'dns';
import type {LookupAddress, LookupAllOptions} from 'dns';
import {Agent as HttpAgent} from 'http';
import type {IncomingMessage} from 'http';
import {Agent as HttpsAgent} from 'https';
import type {LookupFunction} from 'net';
import {URL} from 'url';

const maxRedirects = 5;
const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);

axios.defaults.adapter = require('axios/lib/adapters/http'); // always use Node.js adapter

function getHostnameWithoutBrackets(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

export function isPublicNetworkAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) {
    return false;
  }

  return ipaddr.process(address).range() === 'unicast';
}

export function normalizeAndValidateUrl(url: string, baseUrl?: URL): Result<URL, Error> {
  let normalizedUrl: URL;

  try {
    if (baseUrl instanceof URL) {
      normalizedUrl = new URL(url, baseUrl);
    } else {
      normalizedUrl = new URL(url);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Result.err(new Error(`Invalid URL: "${url}"`, {cause: error}));
    }

    return Result.err(new Error(`Invalid URL: "${url}"`));
  }

  if (normalizedUrl.protocol !== 'http:' && normalizedUrl.protocol !== 'https:') {
    return Result.err(new Error(`Unsupported URL protocol: "${normalizedUrl.protocol}"`));
  }

  if (normalizedUrl.username.length > 0 || normalizedUrl.password.length > 0) {
    return Result.err(new Error(`URL credentials are not supported: "${url}"`));
  }

  const hostname = getHostnameWithoutBrackets(normalizedUrl.hostname);
  if (ipaddr.isValid(hostname) && !isPublicNetworkAddress(hostname)) {
    return Result.err(new Error(`Blocked non-public network destination: "${hostname}"`));
  }

  return Result.ok(normalizedUrl);
}

export type LinkPreviewStreamRequest = {
  readonly url: string;
  readonly responseType: 'stream';
  readonly userAgent: string;
  readonly maximumContentLength?: number;
};

export type LinkPreviewImageRequest = {
  readonly url: string;
  readonly responseType: 'arraybuffer';
  readonly userAgent: string;
  readonly maximumContentLength?: number;
};

export type LinkPreviewRequest = LinkPreviewStreamRequest | LinkPreviewImageRequest;

export type LinkPreviewDnsLookup = (
  hostname: string,
  options: LookupAllOptions,
  callback: (error: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void,
) => void;

export type LinkPreviewRequestDependencies = {
  readonly dnsLookup?: LinkPreviewDnsLookup;
};

export type LinkPreviewStreamResponse = AxiosResponse<IncomingMessage>;
export type LinkPreviewImageResponse = AxiosResponse<Buffer>;

export function createSafeDnsLookup(dnsLookup: LinkPreviewDnsLookup = defaultDnsLookup): LookupFunction {
  return (hostname, options, callback) => {
    const lookupOptions: LookupAllOptions = {
      all: true,
      family: options.family,
      hints: options.hints,
      verbatim: options.verbatim,
    };

    dnsLookup(hostname, lookupOptions, (error, addresses) => {
      if (error !== null) {
        callback(error, '', 0);
        return;
      }

      const hasBlockedAddress = addresses.some(({address}) => {
        return !isPublicNetworkAddress(address);
      });
      if (hasBlockedAddress) {
        callback(new Error(`Blocked non-public network destination for hostname: "${hostname}"`), '', 0);
        return;
      }

      if (addresses.length === 0) {
        callback(new Error(`No network addresses found for hostname: "${hostname}"`), '', 0);
        return;
      }

      if (!options.all) {
        const [address] = addresses;
        callback(null, address.address, address.family);
        return;
      }

      callback(null, addresses);
    });
  };
}

export function requestLinkPreview(
  request: LinkPreviewStreamRequest,
  dependencies?: LinkPreviewRequestDependencies,
): Promise<LinkPreviewStreamResponse>;
export function requestLinkPreview(
  request: LinkPreviewImageRequest,
  dependencies?: LinkPreviewRequestDependencies,
): Promise<LinkPreviewImageResponse>;
export function requestLinkPreview(
  request: LinkPreviewRequest,
  dependencies: LinkPreviewRequestDependencies = {},
): Promise<LinkPreviewStreamResponse | LinkPreviewImageResponse> {
  const normalizedUrlResult = normalizeAndValidateUrl(request.url);
  if (normalizedUrlResult.isErr) {
    return Promise.reject(normalizedUrlResult.error);
  }

  const safeLookup = createSafeDnsLookup(dependencies.dnsLookup);
  const safeHttpAgent = new HttpAgent({lookup: safeLookup});
  const safeHttpsAgent = new HttpsAgent({lookup: safeLookup});
  const normalizedUrl = normalizedUrlResult.value;

  const axiosRequestConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': request.userAgent,
    },
    httpAgent: safeHttpAgent,
    httpsAgent: safeHttpsAgent,
    maxContentLength: request.maximumContentLength,
    maxRedirects: 0,
    method: 'get',
    proxy: false,
    responseType: request.responseType,
    url: normalizedUrl.href,
  };

  if (request.responseType === 'stream') {
    return axios.request<IncomingMessage>(axiosRequestConfig);
  }

  return axios.request<Buffer>(axiosRequestConfig);
}

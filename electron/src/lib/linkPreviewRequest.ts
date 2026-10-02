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

export function normalizeAndValidateUrl(url: string, baseUrl: URL | undefined): Result<URL, Error> {
  let normalizedUrl: URL;

  try {
    if (baseUrl !== undefined) {
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
  readonly dnsLookup: LinkPreviewDnsLookup;
};

export type LinkPreviewStreamResponse = AxiosResponse<IncomingMessage>;
export type LinkPreviewImageResponse = AxiosResponse<Buffer>;

type LinkPreviewResponseData = IncomingMessage | Buffer;

type LinkPreviewResponseExecutor<ResponseData extends LinkPreviewResponseData> = (
  axiosRequestConfig: AxiosRequestConfig,
) => Promise<AxiosResponse<ResponseData>>;

type LinkPreviewRedirectRequest<ResponseData extends LinkPreviewResponseData> = {
  readonly request: LinkPreviewRequest;
  readonly dependencies: LinkPreviewRequestDependencies;
  readonly responseExecutor: LinkPreviewResponseExecutor<ResponseData>;
};

type DestroyableResponseData = {
  readonly destroy: () => void;
};

function isDestroyableResponseData(responseData: unknown): responseData is DestroyableResponseData {
  if (typeof responseData === 'object' && responseData !== null && 'destroy' in responseData) {
    return typeof responseData.destroy === 'function';
  }

  return false;
}

function destroyResponseBody<T>(response: AxiosResponse<T>): void {
  const responseData = response.data;
  if (isDestroyableResponseData(responseData)) {
    responseData.destroy();
  }
}

export function createSafeDnsLookup(dnsLookup: LinkPreviewDnsLookup): LookupFunction {
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

async function requestLinkPreviewWithRedirects<ResponseData extends LinkPreviewResponseData>(
  redirectRequest: LinkPreviewRedirectRequest<ResponseData>,
): Promise<AxiosResponse<ResponseData>> {
  const {request, dependencies, responseExecutor} = redirectRequest;
  const normalizedUrlResult = normalizeAndValidateUrl(request.url, undefined);
  if (normalizedUrlResult.isErr) {
    return Promise.reject(normalizedUrlResult.error);
  }

  const safeLookup = createSafeDnsLookup(dependencies.dnsLookup);
  const safeHttpAgent = new HttpAgent({lookup: safeLookup});
  const safeHttpsAgent = new HttpsAgent({lookup: safeLookup});
  let currentUrl = normalizedUrlResult.value;

  for (let redirectCount = 0; ; redirectCount += 1) {
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
      url: currentUrl.href,
    };

    try {
      return await responseExecutor(axiosRequestConfig);
    } catch (error: unknown) {
      let response: AxiosResponse<IncomingMessage | Buffer> | undefined;
      if (axios.isAxiosError(error)) {
        response = error.response;
      }

      if (response === undefined || !redirectStatusCodes.has(response.status)) {
        return Promise.reject(error);
      }

      destroyResponseBody(response);

      if (redirectCount >= maxRedirects) {
        return Promise.reject(new Error(`Too many redirects while requesting "${currentUrl.href}"`));
      }

      const redirectLocation = response.headers.location;
      if (typeof redirectLocation !== 'string' || redirectLocation.length === 0) {
        return Promise.reject(new Error(`Redirect from "${currentUrl.href}" has no location`));
      }

      const redirectUrlResult = normalizeAndValidateUrl(redirectLocation, currentUrl);
      if (redirectUrlResult.isErr) {
        return Promise.reject(redirectUrlResult.error);
      }

      currentUrl = redirectUrlResult.value;
    }
  }
}

export function requestLinkPreviewStream(
  request: LinkPreviewStreamRequest,
  dependencies: LinkPreviewRequestDependencies,
): Promise<LinkPreviewStreamResponse> {
  return requestLinkPreviewWithRedirects({
    request,
    dependencies,
    responseExecutor: axiosRequestConfig => {
      return axios.request<IncomingMessage>(axiosRequestConfig);
    },
  });
}

export function requestLinkPreviewImage(
  request: LinkPreviewImageRequest,
  dependencies: LinkPreviewRequestDependencies,
): Promise<LinkPreviewImageResponse> {
  return requestLinkPreviewWithRedirects({
    request,
    dependencies,
    responseExecutor: axiosRequestConfig => {
      return axios.request<Buffer>(axiosRequestConfig);
    },
  });
}

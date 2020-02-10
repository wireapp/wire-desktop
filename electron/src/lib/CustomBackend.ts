/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import {
  Event as ElectronEvent,
  OnHeadersReceivedDetails as OnHeadersReceivedListenerDetails,
  OnHeadersReceivedResponse as HeadersReceivedResponse,
  session,
} from 'electron';
import * as path from 'path';

import * as parseCsp from 'content-security-policy-parser';
import * as buildCsp from 'content-security-policy-builder';
import {getLogger} from '../logging/getLogger';

const logger = getLogger(path.basename(__filename));

export interface BackendOptionsEndpoints {
  backendURL: string;
  backendWSURL: string;
  blackListURL: string;
  teamsURL: string;
  accountsURL: string;
  websiteURL: string;
}
export interface BackendOptions {
  endpoints: BackendOptionsEndpoints;
  title: string;
}

const addCustomBackendEndpointsToCSP = (originalCsp: string, backendOptionsEndpoints: BackendOptionsEndpoints) => {
  const csp = parseCsp(originalCsp);
  const {backendURL, backendWSURL, blackListURL} = backendOptionsEndpoints;
  if (backendURL) {
    csp['connect-src'].push(backendURL);
  }
  if (backendWSURL) {
    csp['connect-src'].push(backendWSURL);
  }
  if (blackListURL) {
    csp['connect-src'].push(blackListURL);
  }
  return buildCsp({
    directives: csp,
  });
};

const getOriginOf = (url: string): string => new URL(url).origin;

type ResponseHeaders = Record<string, string[]>;
const changeHeadersFor = (
  filterUrls: string[],
  session: Electron.Session,
  middleware: (url: string, headers: ResponseHeaders) => ResponseHeaders,
) =>
  session.webRequest.onHeadersReceived(
    {urls: filterUrls.map(url => `${url}/*`)},
    (details: OnHeadersReceivedListenerDetails, callback: (response: HeadersReceivedResponse) => void) => {
      callback({
        cancel: false,
        responseHeaders: middleware(getOriginOf(details.url), (details as any).responseHeaders),
      });
    },
  );

export const injectCustomBackend = (
  _event: ElectronEvent,
  _webPreferences: any,
  params: any,
  currentWebappUrl: string,
) => {
  const src = new URL(params.src);
  const backendOptions = src.searchParams.get('backendOptions');
  if (backendOptions) {
    const endpoints = (JSON.parse(backendOptions) as BackendOptions).endpoints;
    const {backendURL, backendWSURL, blackListURL} = endpoints;
    logger.log('Using a custom backend for a webview...');

    // Remove backend url here to preserve privacy
    src.searchParams.delete('backendOptions');
    params.src = src.toString();

    // Get the session of the partition
    const currentSession =
      params.partition && params.partition !== '' ? session.fromPartition(params.partition) : session.defaultSession;
    if (currentSession) {
      const origins = {
        backendURL: getOriginOf(backendURL),
        backendWSURL: getOriginOf(backendWSURL),
        blackListURL: getOriginOf(blackListURL),
        currentWebappUrl: getOriginOf(currentWebappUrl),
      };
      changeHeadersFor([currentWebappUrl, backendURL, backendWSURL], currentSession, (origin, headers) => {
        switch (origin) {
          case origins.currentWebappUrl: {
            logger.log('Modifying CSP for the web app...');
            const [currentCSP] =
              headers['Content-Security-Policy'] || headers['X-Content-Security-Policy'] || headers['X-WebKit-CSP'];
            if (currentCSP) {
              headers['Content-Security-Policy'] = headers['X-Content-Security-Policy'] = headers['X-WebKit-CSP'] = [
                addCustomBackendEndpointsToCSP(currentCSP, endpoints),
              ];
            }
            break;
          }

          case origins.backendURL:
          case origins.backendWSURL:
          case origins.blackListURL: {
            logger.log('Modifying CORS for the backend...');
            const hasCORS = headers['Access-Control-Allow-Credentials'] || headers['Access-Control-Allow-Origin'];
            if (hasCORS) {
              headers['Access-Control-Allow-Credentials'] = ['true'];
              headers['Access-Control-Allow-Origin'] = [currentWebappUrl];
            }
            break;
          }
        }

        return headers;
      });
    }
  }
};

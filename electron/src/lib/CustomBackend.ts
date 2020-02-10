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

const addCustomBackendToCSP = (originalCsp: string, backendUrl: string, directive: string = 'default-src') => {
  const csp = parseCsp(originalCsp[0]);
  // Note: The backend may not be the only host we want to whitelist?
  csp[directive].push(backendUrl);
  return buildCsp({
    directives: csp,
  });
};

export const injectCustomBackend = (
  _event: ElectronEvent,
  _webPreferences: any,
  params: any,
  currentWebappUrl: string,
) => {
  const src = new URL(params.src);
  const customBackend = src.searchParams.get('backendUrl');
  if (customBackend) {
    logger.log('Using a custom backend for a webview...');
    // Remove backend url here to preserve privacy
    src.searchParams.delete('backendUrl');
    params.src = src.toString();

    // Get the session of the partition
    const currentSession =
      params.partition && params.partition !== '' ? session.fromPartition(params.partition) : session.defaultSession;
    if (currentSession) {
      // Intercept requests
      const filter = {urls: [`${currentWebappUrl}/*`, `${customBackend}/*`]};
      const listenerOnHeadersReceived = (
        details: OnHeadersReceivedListenerDetails,
        callback: (response: HeadersReceivedResponse) => void,
      ) => {
        const responseHeaders = (details as any).responseHeaders;
        const extraHeaders: Record<string, string[]> = {};

        const hasCORS =
          responseHeaders['Access-Control-Allow-Credentials'] || responseHeaders['Access-Control-Allow-Origin'];
        if (hasCORS) {
          extraHeaders['Access-Control-Allow-Credentials'] = ['true'];
          extraHeaders['Access-Control-Allow-Origin'] = [currentWebappUrl];
        }

        const currentCSP = responseHeaders['Content-Security-Policy'];
        if (currentCSP) {
          extraHeaders['Content-Security-Policy'] = [addCustomBackendToCSP(currentCSP, customBackend)];
        }

        callback({
          cancel: false,
          responseHeaders: {...details.responseHeaders, ...extraHeaders},
        });
      };
      currentSession.webRequest.onHeadersReceived(filter, listenerOnHeadersReceived);
    }
  }
};

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

import {webFrame, ipcRenderer} from 'electron';

interface SSOData {
  loginAuthorizationSecret: string;
  SSO_PROTOCOL: string;
  SSO_PROTOCOL_HOST: string;
}

ipcRenderer.on('EVENT_TYPE.SSO.WINDOW_LOADED', () => {
  return ipcRenderer.invoke(
    'EVENT_TYPE.IPC.SSO_DATA',
    ({SSO_PROTOCOL, SSO_PROTOCOL_HOST, loginAuthorizationSecret}: SSOData) => {
      // `window.opener` is not available when sandbox is activated,
      // therefore we need to fake the function on backend area and
      // redirect the response to a custom protocol

      const windowOpenerScript = `Object.defineProperty(window, 'opener', {
      configurable: true, // Needed on Chrome :(
      enumerable: false,
      value: Object.freeze({
        postMessage: message => {
          const url = new URL('${SSO_PROTOCOL}://${SSO_PROTOCOL_HOST}/');
          url.searchParams.set('secret', '${loginAuthorizationSecret}');
          url.searchParams.set('type', message.type);
          document.location.href = url.toString();
        }
      }),
      writable: false,
    });0`;
      // ^-- the `;0` is there on purpose to ensure the resulting value of
      // `executeJavaScript()` is not used.
      // See https://github.com/electron/electron/issues/23722.

      webFrame.executeJavaScript(windowOpenerScript).catch(error => console.warn(error));
    },
  );
});

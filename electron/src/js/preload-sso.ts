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

const {webFrame} = require('electron');

// tslint:disable-next-line:no-floating-promises
(async () => {
  const disableEval = `Object.defineProperty(window, 'eval', {
    configurable: false,
    enumerable: false,
    value: function () {
      throw new Error('window.eval() has been disabled');
    },
    writable: false,
  });`;
  await webFrame.executeJavaScript(disableEval);

  // window.opener is not available when sandbox is activated,
  // therefore we need to fake the function and redirect the
  // response to a custom protocol
  const windowOpenerReplacement = `Object.defineProperty(window, 'opener', {
    configurable: true, // Needed on Chrome :(
    enumerable: false,
    value: Object.freeze({
      postMessage: ({type}) => {
        document.location.href='wire-sso://' + type;
      }
    }),
    writable: false,
  });`;

  await webFrame.executeJavaScript(windowOpenerReplacement);
})();

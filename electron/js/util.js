/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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


const electron = require('electron');
const url = require('url');
/*eslint-disable no-unused-vars*/
const debug = require('debug');
const utilDebug = debug('utilDebug');
/*eslint-enable no-unused-vars*/

const config = require('./config');
const environment = require('./environment');
const pointInRectangle = require('./lib/pointInRect');

module.exports = {
  capitalize: (input) => {
    return input.charAt(0).toUpperCase() + input.substr(1);
  },

  isInView: (win) => {
    const windowBounds = win.getBounds();
    const nearestWorkArea = electron.screen.getDisplayMatching(windowBounds).workArea;

    const upperLeftVisible = pointInRectangle([windowBounds.x, windowBounds.y], nearestWorkArea);
    const lowerRightVisible = pointInRectangle([windowBounds.x + windowBounds.width, windowBounds.y + windowBounds.height], nearestWorkArea);

    return upperLeftVisible || lowerRightVisible;
  },

  isMatchingEmbed: (_url) => {
    const hostname = url.parse(_url).hostname;

    for (const embedDomain of config.EMBED_DOMAINS) {
      // If the hostname match
      if (typeof embedDomain.hostname === 'object' && embedDomain.hostname.includes(hostname)) {

        utilDebug('Allowing %s', embedDomain.name);
        return true;
      }
    }

    return false;
  },

  isMatchingEmbedOpenExternalWhitelist: (domain, _url) => {
    const currentHostname = url.parse(domain).hostname;
    const linkHostname = url.parse(_url).hostname;

    for (const embedDomain of config.EMBED_DOMAINS) {
      // If the hostname match
      if (typeof embedDomain.hostname === 'object' && embedDomain.hostname.includes(currentHostname)) {

        // And the link to open is allowed
        return embedDomain.allowedExternalLinks.includes(linkHostname);
      }
    }

    return false;
  },

  isMatchingHost: (_url, _baseUrl) => {
    return url.parse(_url).host === url.parse(_baseUrl).host;
  },

  resizeToBig: (win) => {
    if (!environment.platform.IS_MAC_OS) {
      win.setMenuBarVisibility(true);
    }

    win.setMinimumSize(config.WINDOW.MAIN.MIN_WIDTH, config.WINDOW.MAIN.MIN_HEIGHT);
    win.setSize(config.WINDOW.MAIN.DEFAULT_WIDTH, config.WINDOW.MAIN.DEFAULT_HEIGHT);
    win.setResizable(true);
    win.setMaximizable(true);
    win.center();
  },

  resizeToSmall: (win) => {
    if (!environment.platform.IS_MAC_OS) {
      win.setMenuBarVisibility(false);
    }

    const height = config.WINDOW.AUTH.HEIGHT + (environment.platform.IS_WINDOWS ? 40 : 0);
    win.setFullScreen(false);
    win.setMaximizable(false);
    win.setMinimumSize(config.WINDOW.AUTH.WIDTH, height);
    win.setSize(config.WINDOW.AUTH.WIDTH, height);
    win.setResizable(false);
    win.center();
  },
};

/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
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

'use strict';

const config = require('./config');

const MAIN_FP = 'sha256//i3WcWNbHeLUtbknEiTEbC18p+m9aSg77qFgJ9rCT9Q=';
const strip = (url) => url.replace(/https:|[\/]+/g, '');
const pins = [
  {url: strip(config.PROD_URL), fingerprints: ['sha256/EwEzwQBfMUx/l1QwK/12BK2FCQZN50bNGjgGnq7gQpY=', MAIN_FP]},
  {url: 'wire.com', fingerprints: [MAIN_FP]},
  {url: 'www.wire.com', fingerprints: [MAIN_FP]},
  {url: 'prod-nginz-https.wire.com', fingerprints: [MAIN_FP]},
  {url: 'prod-nginz-ssl.wire.com', fingerprints: [MAIN_FP]},
  {url: 'prod-assets.wire.com', fingerprints: [MAIN_FP]},
];

module.exports = {
  hostnameShouldBePinned (hostname) {
    for (let pin of pins) {
      if (pin.url.toLowerCase().trim() === hostname.toLowerCase().trim()) {
        return true;
      }
    }
    return false;
  },

  verifyPinning (hostname, fingerprint) {
    for (let pin of pins) {
      if (pin.url === hostname) {
        for (let fp of pin.fingerprints) {
          if (fp.trim() === fingerprint.trim()) {
            return true;
          }
        }
        break;
      }
    }
    return false;
  },
};

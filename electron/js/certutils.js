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

const asn1js = require('asn1js');
const crypto = require('crypto');
const pkijs = require('pkijs');

const MAIN_CERT = 'ff4880f09cc1e2d0edc0d07fdcdc987c2b5f4d9c';
const strip = (url) => url.replace(/https:|[\/]+/g, '');
const pins = [
  {url: strip(config.PROD_URL), keys: ['c85f71715e51593828e37cd8450501f3fa5fa4a2', MAIN_CERT]},
  {url: 'wire.com', keys: [MAIN_CERT]},
  {url: 'www.wire.com', keys: [MAIN_CERT]},
  {url: 'prod-nginz-https.wire.com', keys: [MAIN_CERT]},
  {url: 'prod-nginz-ssl.wire.com', keys: [MAIN_CERT]},
  {url: 'prod-assets.wire.com', keys: [MAIN_CERT]},
];

const pemToCert = (pem) => {
  const strippedPem = pem.replace(/(-----(BEGIN|END) CERTIFICATE-----|\n)/g, '').trim();
  const asn1 = asn1js.fromBER(new Uint8Array(Buffer.from(strippedPem, 'base64')).buffer).result;
  return new pkijs.Certificate({schema: asn1});
};

const getPublicKeyHash = (pemString) => {
  const certificate = pemToCert(pemString);
  const publicKey = new Uint8Array(certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex);
  let shasum = crypto.createHash('sha1');
  shasum.update(publicKey);
  return shasum.digest('hex');
};

module.exports = {
  hostnameShouldBePinned (hostname) {
    for (let pin of pins) {
      if (pin.url.toLowerCase().trim() === hostname.toLowerCase().trim()) {
        return true;
      }
    }
    return false;
  },

  verifyPinning (hostname, cert) {
    const certKey = getPublicKeyHash(cert).toLowerCase().trim();

    for (let pin of pins) {
      if (pin.url === hostname) {
        for (let key of pin.keys) {
          if (key.toLowerCase().trim() === certKey) {
            return true;
          }
        }
        break;
      }
    }
    return false;
  },
};

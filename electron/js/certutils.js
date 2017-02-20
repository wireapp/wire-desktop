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
  { url: strip(config.PROD_URL),      keys: [ 'c85f71715e51593828e37cd8450501f3fa5fa4a2',
                                              MAIN_CERT ] },
  { url: 'wire.com',                  keys: [ MAIN_CERT ] },
  { url: 'www.wire.com',              keys: [ MAIN_CERT ] },
  { url: 'prod-nginz-https.wire.com', keys: [ MAIN_CERT ] },
  { url: 'prod-nginz-ssl.wire.com',   keys: [ MAIN_CERT ] },
  { url: 'prod-assets.wire.com',      keys: [ MAIN_CERT ] }
];

const str2ab = (str) => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

const pem2cert = (pem) => {
  const strippedPem = new String(pem).replace(/(-----(BEGIN|END) CERTIFICATE-----|\n)/g, '').trim();
  const raw = new Buffer(strippedPem, 'base64').toString('binary');
  const asn1 = asn1js.fromBER(str2ab(raw)).result;
  return new pkijs.Certificate({ schema: asn1 });
};

const getPublicKeyHash = (cert) => {
  const certificate = pem2cert(cert);
  const publicKey = new Uint8Array(certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex);
  let shasum = crypto.createHash('sha1');
  shasum.update(publicKey);
  return shasum.digest('hex');
};

module.exports = {
  hostnameShouldBePinned (hostname) {
    let foundPin = false;
    for (let pin of pins) {
      if (pin.url.toLowerCase().trim() === hostname.toLowerCase().trim()) {
        foundPin = true;
        break;
      }
    }
    return foundPin;
  },

  verifyPinning (hostname, cert) {
    const certKey = getPublicKeyHash(cert);
    let foundKey = false;

    for (let pin of pins) {
      if (pin.url === hostname) {
        for (let key of pin.keys) {
          if (key.toLowerCase().trim() === certKey.toLowerCase().trim()) {
            foundKey = true;
            break;
          }
        }
        break;
      }
    }
    return foundKey;
  }
};

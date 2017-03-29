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
const crypto = require('crypto');
const rs = require('jsrsasign');

const MAIN_FP = '3pHQns2wdYtN4b2MWsMguGw70gISyhBZLZDpbj+EmdU=';
const DIGICERT_EV_ROOT='-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxszlc+b71LvlLS0ypt/l\ngT/JzSVJtnEqw9WUNGeiChywX2mmQLHEt7KP0JikqUFZOtPclNY823Q4pErMTSWC\n90qlUxI47vNJbXGRfmO2q6Zfw6SE+E9iUb74xezbOJLjBuUIkQzEKEFV+8taiRV+\nceg1v01yCT2+OjhQW3cxG42zxyRFmqesbQAUWgS3uhPrUQqYQUEiTmVhh4FBUKZ5\nXIneGUpX1S7mXRxTLH6YzRoGFqRoc9A0BBNcoXHTWnxV215k4TeHMFYE5RG0KYAS\n8Xk5iKICEXwnZreIt3jyygqoOKsKZMK/Zl2VhMGhJR6HXRpQCyASzEG7bgtROLhL\nywIDAQAB\n-----END PUBLIC KEY-----';
const DIGICERT_GLOBAL_ROOT='-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4jvhEXLeqKTTo1eqUKKP\nC3eQyaKl7hLOllsBCSDMAZOnTjC3U/dDxGkAV53ijSLdhwZAAIEJzs4bg7/fzTtx\nRuLWZscFs3YnFo97nh6Vfe63SKMI2tavegw5BmV/Sl0fvBf4q77uKNd0f3p4mVmF\naG5cIzJLv07A6Fpt43C/dxC//AH2hdmoRBBYMql1GNXRor5H4idq9Joz+EkIYIvU\nX7Q6hL+hqkpMfT7PT19sdl6gSzeRntwi5m3OFBqOasv+zbMUZBfHWymeMr/y7vrT\nC0LUq7dBMtoM1O/4gdW7jVg/tRvoSSiicNoxBN33shbyTApOB6jtSj1etX+jkMOv\nJwIDAQAB\n-----END PUBLIC KEY-----';
const strip = (url) => url.replace(/https:|[\/]+/g, '');
const pins = [
  {url: strip(config.PROD_URL), fingerprints: ['bORoZ2vRsPJ4WBsUdL1h3Q7C50ZaBqPwngDmDVw+wHA=', MAIN_FP], issuer_root: DIGICERT_EV_ROOT},
  {url: 'wire.com', fingerprints: [MAIN_FP], issuer_root: DIGICERT_GLOBAL_ROOT},
  {url: 'www.wire.com', fingerprints: [MAIN_FP], issuer_root: DIGICERT_GLOBAL_ROOT},
  {url: 'prod-nginz-https.wire.com', fingerprints: [MAIN_FP], issuer_root: DIGICERT_GLOBAL_ROOT},
  {url: 'prod-nginz-ssl.wire.com', fingerprints: [MAIN_FP], issuer_root: DIGICERT_GLOBAL_ROOT},
  {url: 'prod-assets.wire.com', fingerprints: [MAIN_FP], issuer_root: DIGICERT_GLOBAL_ROOT},
];

module.exports = {
  hostnameShouldBePinned (hostname) {
    return pins.some((pin) => pin.url.toLowerCase().trim() === hostname.toLowerCase().trim());
  },

  verifyPinning (hostname, certificate) {
    const {data: certData = '', issuerCert: {data: issuerCertData = ''} = {}} = certificate;

    const issuerCert = rs.ASN1HEX.pemToHex(issuerCertData);
    const publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(certData);
    const publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
    const publicKeyFingerprint = crypto.createHash('sha256').update(publicKeyBytes).digest('base64');

    for (let pin of pins) {
      if (pin.url === hostname) {
        const issuerRootPubKey = rs.KEYUTIL.getKey(pin.issuer_root);
        if (!rs.X509.verifySignature(issuerCert, issuerRootPubKey)) {
          return false;
        }
        return pin.fingerprints.some((fingerprint) => fingerprint === publicKeyFingerprint);
      }
    }
  },
};

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



const crypto = require('crypto');
const rs = require('jsrsasign');

const MAIN_FP = '3pHQns2wdYtN4b2MWsMguGw70gISyhBZLZDpbj+EmdU=';
const ALGORITHM_RSA = '2a864886f70d010101';
const VERISIGN_CLASS3_G5_ROOT='-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAryQICCl6NZ5gDKrnSztO\n3Hy8PEUcuyvg/ikC+VcIo2SFFSf18a3IMYldIugqqqZCs4/4uVW3sbdLs/6PfgdX\n7O9D22ZiFWHPYA2k2N744MNiCD1UE+tJyllUhSblK48bn+v1oZHCM0nYQ2NqUkvS\nj+hwUU3RiWl7x3D2s9wSdNt7XUtW05a/FXehsPSiJfKvHJJnGOX0BgTvkLnkAOTd\nOrUZ/wK69Dzu4IvrN4vs9Nes8vbwPa/ddZEzGR0cQMt0JBkhk9kU/qwqUseP1QRJ\n5I1jR4g8aYPL/ke9K35PxZWuDp3U0UPAZ3PjFAh+5T+fc7gzCs9dPzSHloruU+gl\nFQIDAQAB\n-----END PUBLIC KEY-----\n';
const pins = [
  {
    url: /.*app\.wire\.com.*/i,
    publicKeyInfo: [{
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: ['bORoZ2vRsPJ4WBsUdL1h3Q7C50ZaBqPwngDmDVw+wHA=', MAIN_FP],
    }],
  },
  {
    url: /^wire\.com.*/i,
    publicKeyInfo: [{
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    }],
  },
  {
    url: /.*www\.wire.com.*/i,
    publicKeyInfo: [{
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    }],
  },
  {
    url: /.*prod-nginz-https\.wire\.com\.*/i,
    publicKeyInfo: [{
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    }],
  },
  {
    url: /.*prod-nginz-ssl\.wire\.com.*/i,
    publicKeyInfo: [{
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    }],
  },
  {
    url: /.*prod-assets\.wire\.com.*/i,
    publicKeyInfo: [{
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    }],
  },
  {
    url: /.*\.cloudfront\.net.*/i,
    publicKeyInfo: [],
    issuerRootPubkeys: [VERISIGN_CLASS3_G5_ROOT],
  },
];

module.exports = {
  hostnameShouldBePinned (hostname) {
    return pins.some((pin) => pin.url.test(hostname.toLowerCase().trim()));
  },

  verifyPinning (hostname, certificate) {
    const {data: certData = '', issuerCert: {data: issuerCertData = ''} = {}} = certificate;
    let issuerCertHex, publicKey, publicKeyBytes, publicKeyFingerprint;

    try {
      issuerCertHex = rs.ASN1HEX.pemToHex(issuerCertData);
      publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(certData);
      publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
      publicKeyFingerprint = crypto.createHash('sha256').update(publicKeyBytes).digest('base64');
    } catch (err) {
      console.error('verifyPinning', err);
      return {decoding: false};
    }

    const result = {};

    for (const pin of pins) {
      const {url, publicKeyInfo = [], issuerRootPubkeys = []} = pin;
      if (url.test(hostname.toLowerCase().trim())) {
        result.verifiedIssuerRootPubkeys = (issuerRootPubkeys.length > 0) ? issuerRootPubkeys.some((pubkey) => rs.X509.verifySignature(issuerCertHex, rs.KEYUTIL.getKey(pubkey))) : undefined;
        result.verifiedPublicKeyInfo = publicKeyInfo.reduce((arr, pubkey) => {
          const {fingerprints = [], algorithmID = '', algorithmParam = null} = pubkey;
          arr.push(
            (fingerprints.length > 0) ? fingerprints.some((fingerprint) => fingerprint === publicKeyFingerprint) : undefined,
            algorithmID === publicKey.algoid,
            algorithmParam === publicKey.algparam
          );
          return arr;
        }, []).every((val) => val !== false);
        break;
      }
    }

    return result;
  },
};

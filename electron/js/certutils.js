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

const crypto = require('crypto');
const rs = require('jsrsasign');

const WILDCARD_CERT_FINGERPRINT = '3pHQns2wdYtN4b2MWsMguGw70gISyhBZLZDpbj+EmdU=';
const MULTIDOMAIN_CERT_FINGERPRINT = 'bORoZ2vRsPJ4WBsUdL1h3Q7C50ZaBqPwngDmDVw+wHA=';
const CERT_ALGORITHM_RSA = '2a864886f70d010101';
// eslint-disable-next-line no-unused-vars
const PUBLIC_KEY_VERISIGN_CLASS3_G5_ROOT = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAryQICCl6NZ5gDKrnSztO\n3Hy8PEUcuyvg/ikC+VcIo2SFFSf18a3IMYldIugqqqZCs4/4uVW3sbdLs/6PfgdX\n7O9D22ZiFWHPYA2k2N744MNiCD1UE+tJyllUhSblK48bn+v1oZHCM0nYQ2NqUkvS\nj+hwUU3RiWl7x3D2s9wSdNt7XUtW05a/FXehsPSiJfKvHJJnGOX0BgTvkLnkAOTd\nOrUZ/wK69Dzu4IvrN4vs9Nes8vbwPa/ddZEzGR0cQMt0JBkhk9kU/qwqUseP1QRJ\n5I1jR4g8aYPL/ke9K35PxZWuDp3U0UPAZ3PjFAh+5T+fc7gzCs9dPzSHloruU+gl\nFQIDAQAB\n-----END PUBLIC KEY-----\n';
const PUBLIC_KEY_DIGICERT_GLOBAL_ROOT_G2 = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI2/Ou8jqJkTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx1x7e/dfgy5SDN67sH0NO3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQq2EGnI/yuum06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5WztCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQvIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQAB\n-----END PUBLIC KEY-----';
const pins = [
  {
    publicKeyInfo: [{
      algorithmID: CERT_ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MULTIDOMAIN_CERT_FINGERPRINT, WILDCARD_CERT_FINGERPRINT],
    }],
    url: /^app\.wire\.com$/i,
  },
  {
    publicKeyInfo: [{
      algorithmID: CERT_ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MULTIDOMAIN_CERT_FINGERPRINT, WILDCARD_CERT_FINGERPRINT],
    }],
    url: /^(www\.)?wire\.com$/i,
  },
  {
    publicKeyInfo: [{
      algorithmID: CERT_ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [WILDCARD_CERT_FINGERPRINT],
    }],
    url: /^prod-(assets|nginz-https|nginz-ssl)\.wire\.com$/i,
  },
  {
    issuerRootPubkeys: [PUBLIC_KEY_DIGICERT_GLOBAL_ROOT_G2],
    publicKeyInfo: [],
    url: /^[a-z0-9]{14,63}\.cloudfront\.net$/i,
  },
];

module.exports = {
  hostnameShouldBePinned (hostname) {
    return pins.some(pin => pin.url.test(hostname.toLowerCase().trim()));
  },

  verifyPinning (hostname, certificate) {
    const {data: certData = '', issuerCert: {data: issuerCertData = ''} = {}} = certificate;
    let issuerCertHex, publicKey, publicKeyBytes, publicKeyFingerprint;

    try {
      issuerCertHex = rs.pemtohex(issuerCertData);
      publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(certData);
      publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
      publicKeyFingerprint = crypto.createHash('sha256').update(publicKeyBytes).digest('base64');
    } catch (error) {
      console.error(`Certificate verification failed: ${error.message}`, error);
      return {decoding: false};
    }

    const result = {};

    let errorMessages = [];

    for (const pin of pins) {
      const {url, publicKeyInfo = [], issuerRootPubkeys = []} = pin;

      if (url.test(hostname.toLowerCase().trim())) {
        if (issuerRootPubkeys.length > 0) {
          const x509 = new rs.X509();
          x509.readCertHex(issuerCertHex);

          result.verifiedIssuerRootPubkeys = issuerRootPubkeys.some(rawPublicKey => {
            const x509PublicKey = rs.KEYUTIL.getKey(rawPublicKey);
            return x509.verifySignature(x509PublicKey);
          });
          if (!result.verifiedIssuerRootPubkeys) {
            errorMessages.push(`Issuer root public key signatures: none of "${issuerRootPubkeys.join(', ')}" could be verified.`);
          }
        }

        result.verifiedPublicKeyInfo = publicKeyInfo.reduce((arr, pubkey) => {
          const {fingerprints: knownFingerprints = [], algorithmID: knownAlgorithmID = '', algorithmParam: knownAlgorithmParam = null} = pubkey;

          const fingerprintCheck = (knownFingerprints.length > 0) ? knownFingerprints.some(knownFingerprint => knownFingerprint === publicKeyFingerprint) : undefined;
          const algorithmIDCheck = knownAlgorithmID === publicKey.algoid;
          const algorithmParamCheck = knownAlgorithmParam === publicKey.algparam;

          if (!fingerprintCheck) {
            errorMessages.push(`Public key fingerprints: "${publicKeyFingerprint}" could not be verified with any of the known fingerprints "${knownFingerprints.join(', ')}".`);
          }

          if (!algorithmIDCheck) {
            errorMessages.push(`Algorithm ID: "${publicKey.algoid}" could not be verified with the known ID "${knownAlgorithmID}".`);
          }

          if (!algorithmParamCheck) {
            errorMessages.push(`Algorithm parameter: "${publicKey.algparam}" could not be verified with the known parameter "${knownAlgorithmParam}".`);
          }

          arr.push(
            fingerprintCheck,
            algorithmIDCheck,
            algorithmParamCheck
          );

          return arr;
        }, []).every(value => Boolean(value));

        if (errorMessages.length > 0) {
          result.errorMessage = errorMessages.join('\n');
        }

        break;
      }
    }

    return result;
  },
};

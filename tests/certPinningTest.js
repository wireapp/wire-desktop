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

'use strict';

const certutils = require('../electron/js/certutils');
const https = require('https');

const assert = require('assert');

const buildCert = cert => `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64')}\n-----END CERTIFICATE-----`;

const goodURLs = [
  'app.wire.com',
  'prod-assets.wire.com',
  'prod-nginz-https.wire.com',
  'prod-nginz-ssl.wire.com',
  'wire.com',
];

const badURLs = [
  '35vf6hm99t.cloudfront.net',
  'app.wire.com.example.com',
  'error.wire.com',
  'example.com',
  'prod-error.wire.com',
  'prod-nginz-https.wire.com.example.pw',
  'test.app.wire.com.example.pw',
  'wwwire.com',
  'x.cloudfront.net',
];

describe('cert pinning', () => {
  it('pins used hostnames', () => {
    goodURLs.forEach(hostname => assert(certutils.hostnameShouldBePinned(hostname)));
  });

  it("doesn't pin other hostnames", () => {
    badURLs.forEach(hostname => assert.equal(false, certutils.hostnameShouldBePinned(hostname)));
  });

  it('verifies all hostnames', done => {
    const certPromises = goodURLs.map(
      hostname =>
        new Promise(resolve =>
          https.get(`https://${hostname}`).on('socket', socket =>
            socket.on('secureConnect', () => {
              const cert = socket.getPeerCertificate(true);
              const certData = {
                data: buildCert(cert),
                issuerCert: {
                  data: buildCert(cert.issuerCertificate),
                },
              };
              resolve({ certData, hostname });
            }),
          ),
        ),
    );

    Promise.all(certPromises).then(objects => {
      objects.forEach(({hostname, certData}) => {
        assert(certutils.verifyPinning(hostname, certData));
      });
      done();
    });
  });
});

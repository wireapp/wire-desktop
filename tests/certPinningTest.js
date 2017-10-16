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
const path = require('path');

const goodURLs = [
  'app.wire.com',
  'wire.com',
  'prod-assets.wire.com',
  'prod-nginz-https.wire.com',
  'prod-nginz-ssl.wire.com',
  'd3o4r5p7qlbt6o.cloudfront.net',
];

const badURLs = [
  'error.wire.com',
  'prod-error.wire.com',
  'x.cloudfront.net',
  '35vf6hm99t.cloudfront.net',
  'example.com',
  'wwwire.com',
];

describe('cert pinning', () => {

  it('pins used hostnames', () => {
    goodURLs.forEach(hostname => assert(certutils.hostnameShouldBePinned(hostname)));
  });

  it('doesn\'t pin other hostnames', () => {
    badURLs.forEach(hostname => assert.equal(false, certutils.hostnameShouldBePinned(hostname)));
  });

  it('verifies all hostnames', done => {
    const promises = goodURLs.map(hostname => new Promise(resolve =>
      https.get(`https://${hostname}`)
        .on('socket', socket =>
          socket.on('secureConnect', () => {
            const cert = socket.getPeerCertificate(true);
            const data = {
              data: `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64')}\n-----END CERTIFICATE-----`,
              issuerCert: {
                data: `-----BEGIN CERTIFICATE-----\n${cert.issuerCertificate.raw.toString('base64')}\n-----END CERTIFICATE-----`,
              },
            };
            resolve(data);
          })
        )
      )
    );

    Promise.all(promises)
      .then(hostnames => {
        hostnames.forEach(data => assert(certutils.verifyPinning('app.wire.com', data)));
        done()
      });
  });

  it('doesn\'t pin other hostnames', () => {
    badURLs.forEach(hostname => assert.equal(false, certutils.hostnameShouldBePinned(hostname)));
  });

});

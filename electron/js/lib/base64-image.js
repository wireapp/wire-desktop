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



const request = require('request');

const arrayify = require('./arrayify');
const datauri = require('./datauri');

function fetch(url, callback) {
  request({ url: url, encoding: null }, function(error, response, body) {
    if (error) return callback(error);
    let mimetype = response.headers['content-type'];
    callback(null, datauri.fromBuffer(mimetype, body));
  });
}

module.exports = function(urls, limit = 1, callback) {
  let imagesToFetch = arrayify(urls).slice(0, limit);
  let completedRequests = 0;
  let images = [];

  if (imagesToFetch.length === 0) return callback();

  imagesToFetch.forEach(function(url) {
    fetch(url, function(err, dataURI) {
      completedRequests++;
      if (err) console.log('unable to fetch image ');
      if (dataURI) images.push(dataURI);
      if (completedRequests === imagesToFetch.length) {
        callback(images.length > 1 ? images : images[0]);
      }
    });
  });
};

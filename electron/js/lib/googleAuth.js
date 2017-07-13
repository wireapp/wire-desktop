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



const {BrowserWindow} = require('electron');

const qs = require('querystring');
const google = require('googleapis');
const request = require('request');
const OAuth2 = google.auth.OAuth2;


function getAuthenticationUrl(scopes, clientId, clientSecret) {
  const oauth2Client = new OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  return oauth2Client.generateAuthUrl({scope: scopes});
}


function authorizeApp(url) {
  return new Promise(function(resolve, reject) {
    const win = new BrowserWindow({
      'title': '',
      'useContentSize': true,
    });
    win.setMenuBarVisibility(false);
    win.loadURL(url);

    win.on('closed', function() {
      reject(new Error('User closed  the window'));
    });

    win.on('page-title-updated', function() {
      setImmediate(function() {
        const title = win.getTitle();
        if (title.startsWith('Denied')) {
          reject(new Error(title.split(/[ =]/)[2]));
          win.removeAllListeners('closed');
          win.close();
        } else if (title.startsWith('Success')) {
          resolve(title.split(/[ =]/)[2]);
          win.removeAllListeners('closed');
          win.close();
        }
      });
    });
  });
}


function getAuthorizationCode(scopes, clientId, clientSecret) {
  const url = getAuthenticationUrl(scopes, clientId, clientSecret);
  return authorizeApp(url);
}


function getAccessToken(scopes, clientId, clientSecret) {
  return new Promise(function (resolve, reject) {
    getAuthorizationCode(scopes, clientId, clientSecret)
      .then(function (code) {
        const data = qs.stringify({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        });

        request.post('https://accounts.google.com/o/oauth2/token', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: data,
        }, function(error, response, body) {
          if (error) {
            reject(error);
          } else {
            resolve(JSON.parse(body));
          }
        });
      });
  });
}


module.exports = {
  getAuthorizationCode,
  getAccessToken,
};

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



const pkg = require('./../package.json');

let config = {
  AUTH_HEIGHT: 576,
  AUTH_WIDTH: 400,
  CONSOLE_LOG: 'console.log',
  DEFAULT_HEIGHT_MAIN: 768,
  DEFAULT_WIDTH_MAIN: 1024,
  DEV: 'dev',
  EDGE: 'edge',
  EMBED_DOMAINS: [
    {
      allowedExternalLinks: [
        'www.youtube.com',
      ],
      hostname: ['www.youtube-nocookie.com'],
      name: 'YouTube',
    },
    {
      allowedExternalLinks: [
        'vimeo.com',
        'player.vimeo.com',
      ],
      hostname: ['player.vimeo.com'],
      name: 'Vimeo',
    },
    {
      allowedExternalLinks: [
        'soundcloud.com',
      ],
      hostname: ['w.soundcloud.com'],
      name: 'SoundCloud',
    },
    {
      allowedExternalLinks: [
        'www.spotify.com',
        'developer.spotify.com',
      ],
      hostname: ['open.spotify.com', 'embed.spotify.com'],
      name: 'Spotify',
    },
  ],

  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GOOGLE_SCOPES: 'https://www.googleapis.com/auth/contacts.readonly',
  INTERNAL: 'internal',
  LOCALE: [
    'en',
    'cs',
    'da',
    'de',
    'el',
    'es',
    'fi',
    'fr',
    'hr',
    'hu',
    'it',
    'lt',
    'nl',
    'pl',
    'pt',
    'ro',
    'ru',
    'sk',
    'sl',
    'tr',
    'uk',
  ],
  LOCALHOST: 'localhost',
  MIN_HEIGHT_MAIN: 512,
  MIN_WIDTH_MAIN: 760,
  PROD: 'prod',
  RAYGUN_API_KEY: '',
  SPELL_SUGGESTIONS: 4,
  SPELL_SUPPORTED: [
    'en',
  ],
  STAGING: 'staging',
  UPDATE_DELAY: 5 * 60 * 1000,
  UPDATE_INTERVAL: 24 * 60 * 60 * 1000,
  URL_DEV: 'https://wire-webapp-dev.zinfra.io/',
  URL_EDGE: 'https://wire-webapp-edge.zinfra.io/',
  URL_INTERNAL: 'https://wire-webapp-staging.wire.com/?env=prod',
  URL_LOCALHOST: 'http://localhost:8888/',
  URL_PROD: 'https://app.wire.com/',
  URL_STAGING: 'https://wire-webapp-staging.zinfra.io/',
  WIRE: 'https://wire.com',
  WIRE_LEGAL: 'https://wire.com/legal/',
  WIRE_LICENSES: 'https://wire.com/legal/licenses/',
  WIRE_PRIVACY: 'https://wire.com/privacy/',
  WIRE_SUPPORT: 'https://support.wire.com',
};

config.ENVIRONMENT = pkg.environment;
config.PRODUCTION = config.ENVIRONMENT === 'production';
config.DEVELOPMENT = !config.PRODUCTION;
config.UPDATE_WIN_URL = pkg.updateWinUrl;
config.VERSION = pkg.version;
config.NAME = pkg.productName;

module.exports = config;

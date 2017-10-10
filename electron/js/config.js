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

const config = {
  WIRE: 'https://wire.com',
  WIRE_SUPPORT: 'https://support.wire.com',
  WIRE_LEGAL: 'https://wire.com/legal/',
  WIRE_PRIVACY: 'https://wire.com/privacy/',
  WIRE_LICENSES: 'https://wire.com/legal/licenses/',

  ABOUT: {
    HEIGHT: 256,
    WIDTH: 304,
  },

  AUTH: {
    HEIGHT: 576,
    WIDTH: 400,
  },

  MAIN: {
    DEFAULT_HEIGHT: 768,
    DEFAULT_WIDTH: 1024,
    MIN_HEIGHT: 512,
    MIN_WIDTH: 760,
  },

  UPDATE_DELAY: 5 * 60 * 1000,
  UPDATE_INTERVAL: 24 * 60 * 60 * 1000,

  EMBED_DOMAINS: [
    {
      name: 'YouTube',
      hostname: ['www.youtube-nocookie.com'],
      allowedExternalLinks: [
        'www.youtube.com',
      ],
    },
    {
      name: 'Vimeo',
      hostname: ['player.vimeo.com'],
      allowedExternalLinks: [
        'vimeo.com',
        'player.vimeo.com',
      ],
    },
    {
      name: 'SoundCloud',
      hostname: ['w.soundcloud.com'],
      allowedExternalLinks: [
        'soundcloud.com',
      ],
    },
    {
      name: 'Spotify',
      hostname: ['open.spotify.com', 'embed.spotify.com'],
      allowedExternalLinks: [
        'www.spotify.com',
        'developer.spotify.com',
      ],
    },
  ],

  RAYGUN_API_KEY: '',

  GOOGLE_SCOPES: 'https://www.googleapis.com/auth/contacts.readonly',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',

  CONSOLE_LOG: 'console.log',

  SPELL_SUGGESTIONS: 4,
  SPELL_SUPPORTED: [
    'en',
  ],

  VERSION: pkg.version,
  NAME: pkg.productName,
};

module.exports = config;

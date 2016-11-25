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

const app = require('electron').app || require('electron').remote.app;

const config = require('./../js/config');
const init = require('./../js/lib/init');
const de = require('./strings-de');
const cs = require('./strings-cs');
const en = require('./strings-en');
const es = require('./strings-es');
const fi = require('./strings-fi');
const fr = require('./strings-fr');
const hr = require('./strings-hr');
const it = require('./strings-it');
const pt = require('./strings-pt');
const ro = require('./strings-ro');
const ru = require('./strings-ru');
const sl = require('./strings-sl');
const tr = require('./strings-tr');
const uk = require('./strings-uk');

const label = {
  'en': 'English',
  'cs': 'Čeština',
  'de': 'Deutsch',
  'es': 'Español',
  'fi': 'Suomi',
  'fr': 'Français',
  'hr': 'Hrvatski',
  'it': 'Italiano',
  'pt': 'Português do Brasil',
  'ro': 'Română',
  'ru': 'Русский',
  'sl': 'Slovenščina',
  'tr': 'Türkçe',
  'uk': 'Українська',
};

let current;


function getCurrent() {
  if (current == null) {
    // We care only about the language part and not the country (en_US, de_DE)
    current = init.restore('locale', parseLocale(app.getLocale().substr(0, 2)));
  }
  if (config.LOCALE.indexOf(current) === -1) {
    current = config.LOCALE[0];
  }
  return current;
}


function parseLocale(locale) {
  return config.LOCALE.find(loc => loc.includes(locale)) || config.LOCALE[0];
}


function getText(text) {
  var strings = eval(getCurrent());
  return strings[text] || '';
}


function setLocale(locale) {
  current = parseLocale(locale);
  init.save('locale', current);
}


module.exports = {
  'cs': cs,
  'de': de,
  'en': en,
  'es': es,
  'fi': fi,
  'fr': fr,
  'hr': hr,
  'it': it,
  'pt': pt,
  'ro': ro,
  'ru': ru,
  'sl': sl,
  'tr': tr,
  'uk': uk,
  'label': label,
  getCurrent: getCurrent,
  getText: getText,
  setLocale: setLocale,
};

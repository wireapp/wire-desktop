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

window.locStrings = window.locStrings || {};
window.locStringsDefault = window.locStringsDefault || {};

export const getText = (stringIdentifier, paramReplacements) => {
  let str = window.locStrings[stringIdentifier] || window.locStringsDefault[stringIdentifier] || stringIdentifier;

  const replacements = {...paramReplacements};
  for (const replacement of Object.keys(replacements)) {
    const regex = new RegExp(`{${replacement}}`, 'g');
    if (str.match(regex)) {
      str = str.replace(regex, replacements[replacement]);
    }
  }

  return str;
};

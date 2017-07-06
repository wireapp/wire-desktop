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

function is(type, obj) {
  var clas = Object.prototype.toString.call(obj).slice(8, -1);
  return obj != null && clas === type;
}

export default function(data, config) {
  const dataKeys = Object.keys(data);
  const configKeys = Object.keys(config);

  if (dataKeys.length > configKeys) {
    return false;
  }

  return dataKeys.every((key) => {
    return config.hasOwnProperty(key) && is(config[key], data[key]);
  });
}

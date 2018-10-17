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

const isType = <T>(type: string, object: T): object is T => {
  const getType = Object.prototype.toString.call(object).slice(8, -1);
  return object && getType === type;
};

export function verifyObjectProperties(data: any, config: any): Object | false {
  const validatedData: any = {};

  const isValidObject = Object.keys(config).every(key => {
    if (!data.hasOwnProperty(key)) {
      validatedData[key] = config[key] === 'String' ? '' : undefined;
      return true;
    }

    const isValid = isType(config[key], data[key]);
    if (isValid) {
      validatedData[key] = data[key];
    }
    return isValid;
  });

  return isValidObject ? validatedData : false;
}

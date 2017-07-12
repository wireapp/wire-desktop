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

import verifyObjectProperties from '../verifyObjectProperties';

describe('verifyObjectProperties', () => {

  it('should return true if object contains all properties specified in the config', () => {
    const obj = {
      foo: 'test',
      bla: 2,
    };
    const config = {
      foo: 'String',
      bla: 'Number',
    };
    expect(verifyObjectProperties(obj, config)).toBeTruthy();
  });

  it('should return true if object contains only a subset of properties specified in the config', () => {
    const obj = {
      bla: 2,
    };
    const config = {
      foo: 'String',
      bla: 'Number',
    };
    expect(verifyObjectProperties(obj, config)).toBeTruthy();
  });

  it('should return false if object contains a property with a wrong type', () => {
    const obj = {
      foo: 1,
      bla: 2,
    };
    const config = {
      foo: 'String',
      bla: 'Number',
    };
    expect(verifyObjectProperties(obj, config)).toBeFalsy();
  });

  it('should return false if object contains a property with undefined but config excepted a type', () => {
    const obj = {
      foo: 1,
      bla: 2,
    };
    const config = {
      foo: 'String',
      bla: 'Number',
    };
    expect(verifyObjectProperties(obj, config)).toBeFalsy();
  });

  it('should return false if object contains a property that is not specified in the config', () => {
    const obj = {
      foo: 1,
      bla: 2,
    };
    const config = {
      foo: 'String',
    };
    expect(verifyObjectProperties(obj, config)).toBeFalsy();
  });

});
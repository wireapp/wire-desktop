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
  it('should return the object if object contains all properties specified in the config', () => {
    const obj = {
      bla: 2,
      foo: 'test',
    };

    const config = {
      bla: 'Number',
      foo: 'String',
    };

    const validatedObject = verifyObjectProperties(obj, config);
    expect(validatedObject).toBeTruthy();
    expect(Object.keys(validatedObject).length).toBe(2);
  });

  it('should return the object with defaults if object contains only a subset of properties specified in the config', () => {
    const obj = {
      bla: 2,
    };

    const config = {
      bla: 'Number',
      foo: 'String',
      some: 'Number',
    };

    const validatedObject = verifyObjectProperties(obj, config);
    expect(validatedObject).toBeTruthy();
    expect(Object.keys(validatedObject).length).toBe(3);
    expect(validatedObject['foo']).toBe('');
    expect(validatedObject['some']).toBeUndefined();
  });

  it('should return only the expected properties if object contains properties in addition to the expected config', () => {
    const obj = {
      bla: 2,
      foo: '3',
      mistake: 'I should not be here',
    };

    const config = {
      bla: 'Number',
      foo: 'String',
    };

    const validatedObject = verifyObjectProperties(obj, config);
    expect(validatedObject).toBeTruthy();
    expect(Object.keys(validatedObject).length).toBe(2);
    expect(validatedObject['foo']).toBe('3');
    expect(validatedObject['mistake']).toBeUndefined();
  });

  it('should return false if object contains a property with a wrong type', () => {
    const obj = {
      bla: 2,
      foo: 1,
    };

    const config = {
      bla: 'Number',
      foo: 'String',
    };

    expect(verifyObjectProperties(obj, config)).toBeFalsy();
  });

  it('should return false if object contains a property with undefined but config excepted a type', () => {
    const obj = {
      bla: 2,
      foo: undefined,
    };

    const config = {
      bla: 'Number',
      foo: 'String',
    };

    expect(verifyObjectProperties(obj, config)).toBeFalsy();
  });
});

/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import {faker} from '@faker-js/faker';

export type User = {
  firstName: string;
  lastName: string;
  initials: string;
  fullName: string;
  email: string;
  password: string;
};

export const createUser = (): User => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  get initials() {
    return `${this.firstName[0]}${this.lastName[0]}`;
  },
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  email: faker.internet.email({provider: 'wire.engineering'}),
  password: generateValidPassword(),
});

const generateValidPassword = () => {
  const uppercase = faker.string.alpha({length: 1, casing: 'upper'});
  const lowercase = faker.string.alpha({length: 1, casing: 'lower'});
  const number = faker.string.numeric(1);
  const symbol = faker.string.symbol(1);
  const randomChars = faker.string.alphanumeric(4).split('');

  return faker.helpers.shuffle([uppercase, lowercase, number, symbol, ...randomChars]).join('');
};

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

import {BrigApiClient, PublicApiClient} from '../backend';
import {User, RegisteredUser} from '../types';

export const createUser = (): User => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = `${firstName}${lastName}${faker.string.numeric(4)}`.toLowerCase();

  return {
    firstName,
    lastName,
    username,
    get initials() {
      return `${this.firstName[0]}${this.lastName[0]}`;
    },
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    },
    email: faker.internet.email({firstName, lastName, provider: 'wire.engineering'}),
    password: generateValidPassword(),
  };
};

const generateValidPassword = () => {
  const uppercase = faker.string.alpha({length: 1, casing: 'upper'});
  const lowercase = faker.string.alpha({length: 1, casing: 'lower'});
  const number = faker.string.numeric(1);
  const symbol = faker.string.symbol(1);
  const randomChars = faker.string.alphanumeric(4).split('');

  return faker.helpers.shuffle([uppercase, lowercase, number, symbol, ...randomChars]).join('');
};

export const registerUser = async (
  user: User,
  {publicApi, brigApi}: {publicApi: PublicApiClient; brigApi: BrigApiClient},
  options?: {telemetryDataSharing?: boolean},
): Promise<RegisteredUser> => {
  const {id, zuidCookie} = await publicApi.registerUser(user);

  if (id === undefined) {
    throw new Error(`Failed to register user`);
  }

  const activationCode = await brigApi.getUserActivationCode(user.email);
  await publicApi.activateAccount(user.email, activationCode);

  const accessToken = await publicApi.requestAccessToken(zuidCookie);

  await publicApi.setUsername(accessToken, user.username);

  const registeredUser = {...user, id, token: accessToken};

  if (options?.telemetryDataSharing !== undefined) {
    await publicApi.setProperties(registeredUser, {telemetryDataSharing: options.telemetryDataSharing});
  }

  return registeredUser;
};

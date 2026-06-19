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

import {ok, type RequestOpts} from '@oazapfts/runtime';

import * as publicApiClient from './generated/publicApi';

import {User} from '../actions/createUser';

export type RegisteredUser = User & {token: string};

export type TeamOwner = RegisteredUser & {teamId: string};

export type PublicApiClientConfig = {
  baseUrl: string;
};

/**
 * Wrapper around the generated API client to expose a curried version of them providing defaults for the instance and optionally adapting the api with reasonable defaults
 */
export class PublicApiClient {
  private readonly requestOptions: RequestOpts;

  constructor({baseUrl}: PublicApiClientConfig) {
    this.requestOptions = {baseUrl};
  }

  async registerUser(user: User) {
    const registerResponse = await publicApiClient.register(
      {
        xForwardedFor: '',
        newUser: {
          name: user.fullName,
          password: user.password,
          email: user.email,
        },
      },
      this.requestOptions,
    );

    if (registerResponse.status !== 201) {
      throw new Error(`Failed to register user ${user.email}`, {cause: registerResponse.data.message});
    }

    const zuidCookie = registerResponse.headers.getSetCookie().find(cookie => cookie.startsWith('zuid='));
    if (zuidCookie === undefined) {
      throw new Error(`Failed to extract zuid cookie of user ${user.email}`);
    }

    return {...registerResponse.data, zuidCookie};
  }

  async deleteUser(user: RegisteredUser) {
    await publicApiClient.deleteSelf(
      {
        deleteUser: {
          password: user.password,
        },
      },
      {
        ...this.requestOptions,
        headers: {
          ...this.requestOptions.headers,
          Authorization: `Bearer ${user.token}`,
        },
      },
    );
  }

  async activateAccount(email: string, activationCode: string) {
    await publicApiClient.postActivate(
      {
        activate: {email, code: activationCode, dryrun: false},
      },
      this.requestOptions,
    );
  }

  async requestAccessToken(zuidCookie: string) {
    const res = await ok(
      publicApiClient.access(
        {},
        {
          ...this.requestOptions,
          headers: {
            ...this.requestOptions.headers,
            Cookie: zuidCookie,
          },
        },
      ),
    );
    return res.access_token;
  }

  async setUsername(accessToken: string, username: string) {
    await publicApiClient.changeHandle(
      {
        handleUpdate: {handle: username},
      },
      {
        ...this.requestOptions,
        headers: {
          ...this.requestOptions.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  async setProperties(user: RegisteredUser, properties: {telemetryDataSharing?: boolean}) {
    await publicApiClient.setProperty(
      {
        key: 'webapp',
        propertyValue: {
          settings: {privacy: {telemetry_data_sharing: properties.telemetryDataSharing}},
        },
      },
      {
        ...this.requestOptions,
        headers: {...this.requestOptions.headers, Authorization: `Bearer ${user.token}`},
      },
    );
  }

  async upgradeUserToTeamOwner(owner: RegisteredUser, teamName: string) {
    const response = await ok(
      publicApiClient.upgradePersonalToTeam(
        {
          bindingNewTeamUser: {
            name: teamName,
            icon: 'default',
          },
        },
        {
          ...this.requestOptions,
          headers: {
            ...this.requestOptions.headers,
            Authorization: `Bearer ${owner.token}`,
          },
        },
      ),
    );

    return {teamId: response.team_id, teamName: response.team_name};
  }

  async sendTeamInvitation(emailOfInvitee: string, teamOwner: TeamOwner, role: publicApiClient.Role = 'member') {
    const response = await ok(
      publicApiClient.sendTeamInvitation(
        {
          tid: teamOwner.teamId,
          invitationRequest: {
            email: emailOfInvitee,
            role,
            allow_existing: true,
          },
        },
        {
          ...this.requestOptions,
          headers: {
            ...this.requestOptions.headers,
            Authorization: `Bearer ${teamOwner.token}`,
          },
        },
      ),
    );

    return response.id;
  }

  async acceptTeamInvitation(teamInvitationCode: string, user: Pick<RegisteredUser, 'password' | 'token'>) {
    await publicApiClient.acceptTeamInvitation(
      {
        acceptTeamInvitation: {
          code: teamInvitationCode,
          password: user.password,
        },
      },
      {
        ...this.requestOptions,
        headers: {
          ...this.requestOptions.headers,
          Authorization: `Bearer ${user.token}`,
        },
      },
    );
  }

  async deleteTeam(user: RegisteredUser, teamId: string) {
    await publicApiClient.deleteTeam(
      {
        tid: teamId,
        teamDeleteData: {
          password: user.password,
        },
      },
      {
        ...this.requestOptions,
        headers: {
          ...this.requestOptions.headers,
          Authorization: `Bearer ${user.token}`,
        },
      },
    );
  }
}

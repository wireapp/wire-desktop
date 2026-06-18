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

import {type RequestOpts} from '@oazapfts/runtime';
import axios from 'axios';

import * as brigApi from './generated/brigApi';

export type BrigApiClientConfig = {
  baseUrl: string;
  basicAuth: string;
};

/**
 * Wrapper around the generated API client to expose a curried version of them providing defaults for the instance and optionally adapting the api with reasonable defaults
 */
export class BrigApiClient {
  private readonly requestOptions: RequestOpts;

  constructor({baseUrl, basicAuth}: BrigApiClientConfig) {
    this.requestOptions = {
      baseUrl,
      headers: {
        Authorization: basicAuth.startsWith('Basic ') ? basicAuth : `Basic ${basicAuth}`,
      },
    };
  }

  async getUserActivationCode(email: string) {
    const res = await brigApi.iGetUserActivationCode({email}, this.requestOptions);
    return res.code;
  }

  async getTeamActivationCode(team: string, invitationId: string) {
    const res = await brigApi.getInvitationCode({team, invitationId}, this.requestOptions);
    return res.code;
  }

  async unlockConferenceCallingFeature(teamId: string) {
    const {baseUrl, headers} = this.requestOptions;

    await axios.put(`${baseUrl}i/teams/${teamId}/features/conferenceCalling/unlocked`, {}, {headers});
    await axios.patch(
      `${baseUrl}i/teams/${teamId}/features/conferenceCalling`,
      {
        status: 'enabled',
      },
      {headers},
    );
  }
}

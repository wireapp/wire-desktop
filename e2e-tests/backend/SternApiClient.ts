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

import * as sternApi from './generated/sternApi';

export type SternApiClientConfig = {
  baseUrl: string;
  basicAuth: string;
};

/**
 * Wrapper around the generated API client to expose a curried version of them providing defaults for the instance and optionally adapting the api with reasonable defaults
 */
export class SternApiClient {
  private readonly requestOptions: RequestOpts;

  constructor({baseUrl, basicAuth}: SternApiClientConfig) {
    this.requestOptions = {
      baseUrl,
      headers: {
        Authorization: basicAuth.startsWith('Basic ') ? basicAuth : `Basic ${basicAuth}`,
      },
    };
  }

  async unlockConferenceCallingFeature(teamId: string) {
    // These requests don't work, it looks like the OpenAPI spec is wrong and the endpoints are implemented differently
    await sternApi.lockUnlockRouteConferenceCallingConfig({tid: teamId, lockStatus: 'unlocked'}, this.requestOptions);
    await sternApi.putRouteConferenceCallingConfig({tid: teamId, status: 'enabled'}, this.requestOptions);
  }
}
